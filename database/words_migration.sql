-- ============================================
-- Word Warrior - Words Dictionary Table
-- Vocabulary Database Schema
-- ============================================

-- Words Dictionary Table
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word TEXT NOT NULL UNIQUE,
  phonetic TEXT,
  definition TEXT,  -- 英文释义，每行一个释义
  translation TEXT, -- 中文释义，每行一个释义
  pos TEXT,         -- 词性，用 "/" 分割
  collins INTEGER,  -- 柯林斯星级 (1-5)
  oxford BOOLEAN DEFAULT FALSE, -- 是否是牛津三千核心词汇
  tag TEXT,         -- 标签：zk/中考，gk/高考，cet4/四级等
  bnc INTEGER,      -- 英国国家语料库词频顺序
  frq INTEGER,      -- 当代语料库词频顺序
  exchange TEXT,    -- 时态复数等变换，使用 "/" 分割
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for faster vocabulary queries
-- ============================================

-- Index for word lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);

-- Index for filtering by tags (e.g., 中考/高考/四级)
CREATE INDEX IF NOT EXISTS idx_words_tag ON words USING GIN (to_tsvector('simple', tag));

-- Index for oxford core vocabulary
CREATE INDEX IF NOT EXISTS idx_words_oxford ON words(oxford) WHERE oxford = true;

-- Index for collins rating
CREATE INDEX IF NOT EXISTS idx_words_collins ON words(collins) WHERE collins IS NOT NULL;

-- Index for frequency-based queries (BNC)
CREATE INDEX IF NOT EXISTS idx_words_bnc ON words(bnc) WHERE bnc IS NOT NULL;

-- Index for frequency-based queries (FRQ)
CREATE INDEX IF NOT EXISTS idx_words_frq ON words(frq) WHERE frq IS NOT NULL;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get random words by filters
CREATE OR REPLACE FUNCTION get_random_words(
  limit_count INTEGER DEFAULT 10,
  filter_tag TEXT DEFAULT NULL,
  filter_oxford BOOLEAN DEFAULT NULL,
  min_collins INTEGER DEFAULT NULL
)
RETURNS SETOF words AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM words
  WHERE 
    (filter_tag IS NULL OR tag LIKE '%' || filter_tag || '%')
    AND (filter_oxford IS NULL OR oxford = filter_oxford)
    AND (min_collins IS NULL OR collins >= min_collins)
  ORDER BY RANDOM()
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to search words (for autocomplete/search)
CREATE OR REPLACE FUNCTION search_words(search_term TEXT, limit_count INTEGER DEFAULT 20)
RETURNS SETOF words AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM words
  WHERE word ILIKE search_term || '%'
  ORDER BY 
    CASE 
      WHEN word = search_term THEN 0
      WHEN word LIKE search_term || '%' THEN 1
      ELSE 2
    END,
    bnc NULLS LAST,
    frq NULLS LAST
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for auto-updating updated_at on words
CREATE TRIGGER update_words_updated_at
BEFORE UPDATE ON words
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on words table
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

-- Everyone can read words (public dictionary)
CREATE POLICY "Words are viewable by everyone"
  ON words FOR SELECT
  USING (true);

-- Only admins can insert/update/delete words
CREATE POLICY "Only admins can modify words"
  ON words FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- NOTES & USAGE EXAMPLES
-- ============================================

-- To import CSV data:
-- 1. Save your CSV file
-- 2. Use Supabase dashboard or psql to import:
--    COPY words(word, phonetic, definition, translation, pos, collins, oxford, tag, bnc, frq, exchange)
--    FROM '/path/to/your/words.csv'
--    DELIMITER ','
--    CSV HEADER;
--
-- Query Examples:
-- 
-- Get 10 random CET4 words:
--   SELECT * FROM get_random_words(10, 'cet4', NULL, NULL);
--
-- Get oxford core vocabulary:
--   SELECT * FROM get_random_words(10, NULL, true, NULL);
--
-- Search for words starting with 'app':
--   SELECT * FROM search_words('app', 20);
--
-- Get high-frequency words (low BNC/FRQ number = high frequency):
--   SELECT * FROM words WHERE bnc IS NOT NULL ORDER BY bnc LIMIT 100;
