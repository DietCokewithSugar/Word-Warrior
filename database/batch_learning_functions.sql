-- ============================================
-- Word Warrior - Batch Learning Functions
-- ============================================

-- Function to get a batch of next words for a user
-- Respects frq order and excludes already mastered words
CREATE OR REPLACE FUNCTION get_next_words_batch(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
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
  WITH priority_words AS (
    -- 首先获取那些正在学习中且最近答错的单词，或者已经在学习但还没到冷却时间的词
    -- 这里的逻辑是：如果最近一次是错的，或者正确率较低，就不受 12 小时冷却限制
    SELECT 
      w.id, w.word, w.phonetic, w.definition, w.translation, w.pos, 
      w.collins, w.oxford, w.tag, w.bnc, w.frq, w.exchange,
      CASE 
        WHEN uwp.status = 'learning' AND uwp.incorrect_count > 0 THEN 1 -- 正在学且有错误记录的最高优先级
        ELSE 2 -- 新词
      END as p_rank
    FROM words w
    LEFT JOIN user_word_progress uwp ON w.id = uwp.word_id AND uwp.user_id = p_user_id
    WHERE 
      (uwp.user_id IS NULL) -- 新词
      OR (
        uwp.status = 'learning' 
        AND (
          -- 如果最近一次练习是错误的，不受 12 小时限制，立即重新出现
          -- 或者简单的逻辑：只要没掌握，就有机会出现，但通过排序控制
          uwp.last_reviewed_at <= NOW() - INTERVAL '12 hours'
          OR uwp.incorrect_count > 0 -- 有错误记录的优先回来
        )
      )
      AND (uwp.status != 'mastered' OR uwp.status IS NULL)
  )
  SELECT 
    pw.id, pw.word, pw.phonetic, pw.definition, pw.translation, pw.pos, 
    pw.collins, pw.oxford, pw.tag, pw.bnc, pw.frq, pw.exchange
  FROM priority_words pw
  ORDER BY 
    pw.p_rank ASC, -- 优先推练习过但没对的
    CASE WHEN pw.frq = 0 THEN 999999 ELSE pw.frq END ASC,
    pw.id ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Helper to get random words for distractors (excluding correct word)
-- Used for quiz generation
CREATE OR REPLACE FUNCTION get_distractors(
  p_exclude_word_id UUID,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  word TEXT,
  translation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.word,
    w.translation
  FROM words w
  WHERE w.id != p_exclude_word_id
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
