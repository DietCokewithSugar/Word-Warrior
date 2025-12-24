-- ============================================
-- 1. SHOP ITEMS TABLE
-- ============================================
create table if not exists shop_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('weapon', 'armor', 'shield')),
  price int not null,
  atk_bonus int default 0,
  def_bonus int default 0,
  hp_bonus int default 0,
  asset_key text,
  created_at timestamptz default now()
);

-- ============================================
-- 2. USER EQUIPMENT TABLE
-- ============================================
create table if not exists user_equipment (
  user_id uuid primary key references auth.users(id),
  weapon_id uuid references shop_items(id),
  shield_id uuid references shop_items(id),
  armor_id uuid references shop_items(id),
  updated_at timestamptz default now()
);

-- ============================================
-- 2.5 USER INVENTORY TABLE (New)
-- ============================================
create table if not exists user_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  item_id uuid references shop_items(id),
  obtained_at timestamptz default now(),
  unique(user_id, item_id)
);

-- Index for performance
create index if not exists idx_shop_items_type on shop_items(type);

-- ============================================
-- 3. SEED DATA (Shop Items)
-- ============================================
-- Clear existing items to avoid duplicates if re-running (optional, valid for dev)
truncate table shop_items cascade;

DO $$
DECLARE
  v_i int;
  v_price int;
  v_stat int;
  v_name text;
  v_asset text;
  v_names text[] := ARRAY['Wooden', 'Iron', 'Steel', 'Reinforced', 'Elite', 'Commander', 'Master', 'Grandmaster', 'Legendary', 'Godly'];
BEGIN
  -- WEAPONS (Atk 3 -> 1000)
  FOR v_i IN 1..10 LOOP
    v_price := round(100 * power(10000.0, (v_i - 1)::float / 9.0));
    v_stat := round(3 * power(333.3333, (v_i - 1)::float / 9.0));
    v_name := v_names[v_i] || ' Sword';
    v_asset := 'weapon_' || lower(v_names[v_i]);
    
    INSERT INTO shop_items (name, type, price, atk_bonus, def_bonus, hp_bonus, asset_key)
    VALUES (v_name, 'weapon', v_price, v_stat, 0, 0, v_asset);
  END LOOP;

  -- SHIELDS (Def 3 -> 1000)
  FOR v_i IN 1..10 LOOP
    v_price := round(100 * power(10000.0, (v_i - 1)::float / 9.0));
    v_stat := round(3 * power(333.3333, (v_i - 1)::float / 9.0));
    v_name := v_names[v_i] || ' Shield';
    v_asset := 'shield_' || lower(v_names[v_i]);
    
    INSERT INTO shop_items (name, type, price, atk_bonus, def_bonus, hp_bonus, asset_key)
    VALUES (v_name, 'shield', v_price, 0, v_stat, 0, v_asset);
  END LOOP;

  -- ARMOR (HP 10 -> 3000)
  FOR v_i IN 1..10 LOOP
    v_price := round(100 * power(10000.0, (v_i - 1)::float / 9.0));
    v_stat := round(10 * power(300.0, (v_i - 1)::float / 9.0));
    v_name := v_names[v_i] || ' Armor';
    v_asset := 'armor_' || lower(v_names[v_i]);
    
    INSERT INTO shop_items (name, type, price, atk_bonus, def_bonus, hp_bonus, asset_key)
    VALUES (v_name, 'armor', v_price, 0, 0, v_stat, v_asset);
  END LOOP;
END $$;

-- ============================================
-- 4. PURCHASE FUNCTION
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
  v_msg text;
begin
  -- 1. Get Item Details
  select * into v_item from shop_items where id = p_item_id;
  if not found then 
    return jsonb_build_object('success', false, 'message', 'Item not found');
  end if;

  -- 2. Check if already owned
  if exists (select 1 from user_inventory where user_id = p_user_id and item_id = p_item_id) then
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

  -- 6. Return Success with camelCase
  return jsonb_build_object(
    'success', true, 
    'newGold', v_new_gold, 
    'message', 'Purchase successful'
  );
end;
$$;
