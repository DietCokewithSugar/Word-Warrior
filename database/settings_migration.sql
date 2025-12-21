-- ============================================
-- User Settings Migration
-- ============================================

-- 1. Create the user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme_mode TEXT NOT NULL DEFAULT 'system', -- 'light', 'dark', 'system'
    theme_color TEXT NOT NULL DEFAULT 'indigo',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Allow users to view their own settings
CREATE POLICY "Users can view own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own settings
CREATE POLICY "Users can insert own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own settings
CREATE POLICY "Users can update own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- 4. Update the handle_new_user trigger function
-- We replace the existing function to also insert into user_settings
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.profiles (id, email, username, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    false
  );
  
  -- Create initial user stats
  INSERT INTO public.user_stats (
    user_id, 
    level, 
    exp, 
    atk, 
    def, 
    crit, 
    hp, 
    max_hp, 
    rank, 
    rank_points, 
    win_streak, 
    mastered_words_count, 
    login_days
  )
  VALUES (
    NEW.id,
    1,      -- level
    0,      -- exp
    10,     -- atk
    10,     -- def
    0.05,   -- crit
    100,    -- hp
    100,    -- max_hp
    'Bronze', -- rank
    120,    -- rank_points
    0,      -- win_streak
    0,      -- mastered_words_count
    1       -- login_days
  );

  -- Create default user settings
  INSERT INTO public.user_settings (user_id, theme_mode, theme_color)
  VALUES (
    NEW.id,
    'system',
    'indigo'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger 'on_auth_user_created' already exists and calls this function,
-- so we don't need to recreate the trigger itself, just updating the function is enough.
