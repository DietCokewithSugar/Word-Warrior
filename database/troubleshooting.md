# 单词学习功能排查指南

## 问题：显示统计但没有单词卡片

### 步骤 1: 检查 words 表是否有数据

在 Supabase SQL Editor 中运行：

```sql
-- 检查 words 表是否有数据
SELECT COUNT(*) as total_words FROM words;

-- 查看前几个单词（按 frq 排序）
SELECT word, frq, phonetic, translation 
FROM words 
ORDER BY 
  CASE WHEN frq = 0 THEN 999999 ELSE frq END ASC
LIMIT 10;
```

**如果返回 0 条记录**：
- 你需要先导入单词 CSV 数据
- 参考 `database/import_words_guide.md`

---

### 步骤 2: 测试数据库函数

在 Supabase SQL Editor 中运行：

```sql
-- 替换成你的真实 user_id
-- 可以通过以下查询获取：
SELECT id, email FROM auth.users LIMIT 5;

-- 然后测试函数（替换下面的 'your-user-id'）
SELECT * FROM get_next_word_for_user('your-user-id');
```

**预期结果**：应该返回一个单词对象

**如果返回空**：
- 检查是否所有单词都已被标记为 mastered
- 运行：`SELECT * FROM user_word_progress WHERE user_id = 'your-user-id';`

---

### 步骤 3: 检查浏览器控制台错误

1. 打开浏览器
2. 按 F12 打开开发者工具
3. 切换到 Console 标签
4. 查找红色错误信息
5. 特别注意以下错误：
   - `Error fetching next word`
   - `function get_next_word_for_user does not exist`
   - RLS policy errors

---

### 步骤 4: 检查 RLS 权限

在 Supabase SQL Editor 中运行：

```sql
-- 确认 words 表的 RLS 策略
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'words';

-- 确认 user_word_progress 表的 RLS 策略
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'user_word_progress';
```

**应该看到**：
- words: "Words are viewable by everyone" (SELECT)
- user_word_progress: "Users can view their own word progress" (SELECT)

---

### 步骤 5: 临时禁用 RLS 测试

**仅用于调试！调试完记得重新启用！**

```sql
-- 临时禁用（调试用）
ALTER TABLE words DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_word_progress DISABLE ROW LEVEL SECURITY;

-- 调试完成后重新启用
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_word_progress ENABLE ROW LEVEL SECURITY;
```

---

### 步骤 6: 手动测试数据库连接

在前端添加调试日志，修改 `VocabTraining.tsx`：

在 `loadNextWord` 函数中添加：

```typescript
const loadNextWord = async () => {
  if (!user) return;
  
  console.log('🔍 Loading next word for user:', user.id);
  setLoading(true);
  try {
    const word = await getNextWord(user.id);
    console.log('📚 Fetched word:', word);
    if (word) {
      setCurrentWord(word);
    } else {
      console.log('⚠️ No word returned');
      setSessionComplete(true);
    }
  } catch (error) {
    console.error('❌ Error loading word:', error);
  } finally {
    setLoading(false);
  }
};
```

---

## 快速诊断命令

运行这个 SQL 来全面检查：

```sql
-- 全面诊断
DO $$
DECLARE
  word_count INTEGER;
  user_count INTEGER;
  progress_count INTEGER;
BEGIN
  -- 检查 words 表
  SELECT COUNT(*) INTO word_count FROM words;
  RAISE NOTICE 'Words in database: %', word_count;
  
  -- 检查用户表
  SELECT COUNT(*) INTO user_count FROM auth.users;
  RAISE NOTICE 'Users in database: %', user_count;
  
  -- 检查进度表
  SELECT COUNT(*) INTO progress_count FROM user_word_progress;
  RAISE NOTICE 'Progress records: %', progress_count;
  
  -- 检查函数是否存在
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_next_word_for_user'
  ) THEN
    RAISE NOTICE '✓ Function get_next_word_for_user exists';
  ELSE
    RAISE NOTICE '✗ Function get_next_word_for_user NOT FOUND';
  END IF;
END $$;
```

---

## 最可能的原因

1. **words 表为空** → 需要导入 CSV 数据
2. **函数未创建** → 重新运行 `user_word_progress_migration.sql`
3. **RLS 阻止访问** → 检查权限策略

请按顺序执行上述步骤，告诉我每一步的结果！
