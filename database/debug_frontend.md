## 浏览器控制台检查步骤

1. **打开浏览器开发者工具**
   - 按 `F12` 或 `Cmd+Option+I` (Mac)
   
2. **切换到 Console 标签**
   - 查看是否有红色错误信息
   
3. **刷新页面**
   - 按 `Cmd+R` (Mac) 或 `Ctrl+R` (Windows)
   
4. **查找这些错误**：
   - `Error fetching next word`
   - `function get_next_word_for_user does not exist`
   - 任何与 `supabase` 或 `RPC` 相关的错误
   
5. **截图或复制错误信息**
   - 包括完整的错误堆栈

## 同时检查 Network 标签

1. 切换到 **Network** 标签
2. 刷新页面
3. 查找失败的请求（红色）
4. 特别注意 `get_next_word_for_user` 相关的请求

## 临时调试方案

如果没有明显错误，运行这个 SQL 来测试函数调用：

```sql
-- 获取你的 user_id
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- 用你的真实 user_id 测试（替换下面的 'xxx'）
SELECT * FROM get_next_word_for_user('你的user_id');
```

应该返回一个单词对象。
