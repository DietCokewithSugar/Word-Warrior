-- ============================================
-- 1. USER INVENTORY TABLE
-- ============================================
create table if not exists user_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  item_id uuid references shop_items(id) not null,
  acquired_at timestamptz default now(),
  unique(user_id, item_id) -- Prevent duplicate ownership of same item if that's the design. User requested "multiple items", typically one of each specific item is enough for this game type, but let's stick to unique for now to prevent accidental double purchase.
);

-- ============================================
-- 2. PURCHASE FUNCTION (UPDATED)
-- ============================================
create or replace function purchase_equipment(p_user_id uuid, p_item_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_item record;
  v_user_gold int;
  v_new_gold int;
  v_already_owned boolean;
begin
  -- 1. Get Item Details
  select * into v_item from shop_items where id = p_item_id;
  if not found then 
    return jsonb_build_object('success', false, 'message', 'Item not found');
  end if;

  -- 2. Check if already owned
  select exists(select 1 from user_inventory where user_id = p_user_id and item_id = p_item_id) into v_already_owned;
  if v_already_owned then
     return jsonb_build_object('success', false, 'message', 'Item already owned');
  end if;

  -- 3. Check Gold
  select gold into v_user_gold from user_stats where user_id = p_user_id;
  if v_user_gold is null then
     raise exception 'User stats not found';
  end if;
  
  if v_user_gold < v_item.price then
    return jsonb_build_object('success', false, 'message', 'Insufficient funds');
  end if;

  -- 4. Deduct Gold
  update user_stats 
  set gold = gold - v_item.price 
  where user_id = p_user_id 
  returning gold into v_new_gold;

  -- 5. Add to Inventory
  insert into user_inventory (user_id, item_id) values (p_user_id, p_item_id);

  return jsonb_build_object(
    'success', true, 
    'newGold', v_new_gold, 
    'message', 'Purchase successful! Item added to inventory.'
  );
end;
$$;

-- ============================================
-- 3. EQUIP FUNCTION (NEW)
-- ============================================
create or replace function equip_item(p_user_id uuid, p_item_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_item record;
  v_current_equip_row record;
  v_old_item_id uuid;
  v_old_stat int := 0;
  v_new_stat int := 0;
  v_stat_col text;
  v_msg text;
  v_owned boolean;
begin
  -- 1. Check Ownership
  select exists(select 1 from user_inventory where user_id = p_user_id and item_id = p_item_id) into v_owned;
  if not v_owned then
     return jsonb_build_object('success', false, 'message', 'Item not owned');
  end if;

  -- 2. Get Item Details
  select * into v_item from shop_items where id = p_item_id;

  -- 3. Get Current Equipment
  select * into v_current_equip_row from user_equipment where user_id = p_user_id;
  if not found then
    insert into user_equipment (user_id) values (p_user_id) returning * into v_current_equip_row;
  end if;

  -- 4. Determine Slot and Stat Logic
  if v_item.type = 'weapon' then
    v_old_item_id := v_current_equip_row.weapon_id;
    v_new_stat := v_item.atk_bonus;
    v_stat_col := 'atk';
    
    -- Get old stat
    if v_old_item_id is not null then
       select atk_bonus into v_old_stat from shop_items where id = v_old_item_id;
    end if;

    -- Update Equipment Table
    update user_equipment set weapon_id = p_item_id, updated_at = now() where user_id = p_user_id;

    -- Update User Stats
    update user_stats 
    set atk = atk - coalesce(v_old_stat, 0) + v_new_stat
    where user_id = p_user_id;

  elsif v_item.type = 'shield' then
    v_old_item_id := v_current_equip_row.shield_id;
    v_new_stat := v_item.def_bonus;
     v_stat_col := 'def';

    if v_old_item_id is not null then
       select def_bonus into v_old_stat from shop_items where id = v_old_item_id;
    end if;

    update user_equipment set shield_id = p_item_id, updated_at = now() where user_id = p_user_id;

    update user_stats 
    set def = def - coalesce(v_old_stat, 0) + v_new_stat
    where user_id = p_user_id;

  elsif v_item.type = 'armor' then
    v_old_item_id := v_current_equip_row.armor_id;
    v_new_stat := v_item.hp_bonus;
     v_stat_col := 'hp'; -- and max_hp

    if v_old_item_id is not null then
       select hp_bonus into v_old_stat from shop_items where id = v_old_item_id;
    end if;

    update user_equipment set armor_id = p_item_id, updated_at = now() where user_id = p_user_id;

    update user_stats 
    set max_hp = max_hp - coalesce(v_old_stat, 0) + v_new_stat,
        hp = hp - coalesce(v_old_stat, 0) + v_new_stat -- Also boost current HP
    where user_id = p_user_id;
  
  else
    return jsonb_build_object('success', false, 'message', 'Invalid item type');
  end if;

  return jsonb_build_object(
    'success', true, 
    'message', 'Equipped ' || v_item.name || '!'
  );
end;
$$;
