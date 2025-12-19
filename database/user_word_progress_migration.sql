-- ============================================
-- Word Warrior - User Word Progress Tracking
-- Tracks individual user's vocabulary learning progress
-- ============================================

-- User Word Progress Table
CREATE TABLE IF NOT EXISTS user_word_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'learning', -- 'learning', 'mastered', 'reviewing'
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mastered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Index for user-specific queries (most common)
CREATE INDEX IF NOT EXISTS idx_user_word_progress_user_id 
  ON user_word_progress(user_id);

-- Compound index for filtering by user and status
CREATE INDEX IF NOT EXISTS idx_user_word_progress_user_status 
  ON user_word_progress(user_id, status);

-- Index for date-based queries (e.g., words learned today)
CREATE INDEX IF NOT EXISTS idx_user_word_progress_mastered_at 
  ON user_word_progress(user_id, mastered_at) 
  WHERE mastered_at IS NOT NULL;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Get next word for a user based on frq order
-- Excludes already-learned words
CREATE OR REPLACE FUNCTION get_next_word_for_user(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  word TEXT,
  phonetic TEXT,
  definition TEXT,
  translation TEXT,
  pos TEXT,
  collins INTEGER,
  oxford BOOLEAN,
  tag TEXT,
  bnc INTEGER,
  frq INTEGER,
  exchange TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.word,
    w.phonetic,
    w.definition,
    w.translation,
    w.pos,
    w.collins,
    w.oxford,
    w.tag,
    w.bnc,
    w.frq,
    w.exchange
  FROM words w
  WHERE NOT EXISTS (
    -- Exclude words already learned (mastered status)
    SELECT 1 FROM user_word_progress uwp
    WHERE uwp.user_id = p_user_id
      AND uwp.word_id = w.id
      AND uwp.status = 'mastered'
  )
  ORDER BY 
    -- Words with frq=0 go to the end
    CASE WHEN w.frq = 0 THEN 999999 ELSE w.frq END ASC,
    w.id ASC -- Secondary sort for deterministic ordering
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Get user's learning statistics
CREATE OR REPLACE FUNCTION get_user_learning_stats(p_user_id UUID)
RETURNS TABLE (
  total_words_learned INTEGER,
  words_learned_today INTEGER,
  total_correct INTEGER,
  total_incorrect INTEGER,
  accuracy_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_words_learned,
    COUNT(*) FILTER (WHERE DATE(mastered_at) = CURRENT_DATE)::INTEGER as words_learned_today,
    SUM(correct_count)::INTEGER as total_correct,
    SUM(incorrect_count)::INTEGER as total_incorrect,
    CASE 
      WHEN SUM(correct_count + incorrect_count) > 0 
      THEN ROUND((SUM(correct_count)::NUMERIC / SUM(correct_count + incorrect_count)::NUMERIC) * 100, 1)
      ELSE 0 
    END as accuracy_percentage
  FROM user_word_progress
  WHERE user_id = p_user_id
    AND status = 'mastered';
END;
$$ LANGUAGE plpgsql;

-- Mark a word as learned/mastered
CREATE OR REPLACE FUNCTION mark_word_progress(
  p_user_id UUID,
  p_word_id UUID,
  p_correct BOOLEAN
)
RETURNS user_word_progress AS $$
DECLARE
  v_progress user_word_progress;
BEGIN
  -- Insert or update progress
  INSERT INTO user_word_progress (user_id, word_id, correct_count, incorrect_count, last_reviewed_at)
  VALUES (
    p_user_id, 
    p_word_id, 
    CASE WHEN p_correct THEN 1 ELSE 0 END,
    CASE WHEN p_correct THEN 0 ELSE 1 END,
    NOW()
  )
  ON CONFLICT (user_id, word_id) 
  DO UPDATE SET
    correct_count = user_word_progress.correct_count + CASE WHEN p_correct THEN 1 ELSE 0 END,
    incorrect_count = user_word_progress.incorrect_count + CASE WHEN p_correct THEN 0 ELSE 1 END,
    last_reviewed_at = NOW(),
    updated_at = NOW(),
    -- Mark as mastered after 3 correct answers
    status = CASE 
      WHEN user_word_progress.correct_count + CASE WHEN p_correct THEN 1 ELSE 0 END >= 3 
      THEN 'mastered' 
      ELSE 'learning' 
    END,
    mastered_at = CASE 
      WHEN user_word_progress.correct_count + CASE WHEN p_correct THEN 1 ELSE 0 END >= 3 
        AND user_word_progress.mastered_at IS NULL
      THEN NOW()
      ELSE user_word_progress.mastered_at
    END
  RETURNING * INTO v_progress;
  
  RETURN v_progress;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_user_word_progress_updated_at
BEFORE UPDATE ON user_word_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_word_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own progress
CREATE POLICY "Users can view their own word progress"
  ON user_word_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert their own word progress"
  ON user_word_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own word progress"
  ON user_word_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Get next word for a user:
--   SELECT * FROM get_next_word_for_user('user-uuid-here');
--
-- Mark word as correct:
--   SELECT * FROM mark_word_progress('user-uuid', 'word-uuid', true);
--
-- Get user stats:
--   SELECT * FROM get_user_learning_stats('user-uuid');
--
-- Check user's progress on a specific word:
--   SELECT * FROM user_word_progress 
--   WHERE user_id = 'user-uuid' AND word_id = 'word-uuid';
