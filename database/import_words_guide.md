# 单词数据导入指南

## 步骤 1: 运行迁移脚本

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制并粘贴 `words_migration.sql` 的全部内容
4. 点击 "Run" 执行

## 步骤 2: 准备 CSV 文件

确保你的 CSV 文件格式正确，列的顺序应该是：
```
word,phonetic,definition,translation,pos,collins,oxford,tag,bnc,frq,exchange
```

**注意事项：**
- `oxford` 字段应该是 `true`/`false` 或 `1`/`0`
- 空值应该留空或使用 `NULL`
- 多行文本（如 definition、translation）需要用引号包裹，换行符保留

## 步骤 3: 导入数据

### 方法 1: 使用 Supabase Dashboard (推荐)

1. 进入 Supabase Dashboard → Table Editor
2. 选择 `words` 表
3. 点击 "Insert" → "Import data from CSV"
4. 上传你的 CSV 文件
5. 确认字段映射
6. 点击导入

### 方法 2: 使用 SQL (适用于大文件)

在 Supabase SQL Editor 中运行：

```sql
-- 临时关闭 RLS 以便导入（完成后记得重新启用）
ALTER TABLE words DISABLE ROW LEVEL SECURITY;

-- 导入数据（需要将文件上传到 Supabase Storage 或使用本地 psql）
-- 如果使用 psql 连接到数据库：
COPY words(word, phonetic, definition, translation, pos, collins, oxford, tag, bnc, frq, exchange)
FROM '/path/to/your/words.csv'
DELIMITER ','
CSV HEADER;

-- 重新启用 RLS
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
```

### 方法 3: 使用 JavaScript/TypeScript 批量导入

创建一个导入脚本 `scripts/import-words.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // 需要 service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importWords(filePath: string) {
  const words: any[] = [];
  
  // 读取 CSV
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      words.push({
        word: row.word,
        phonetic: row.phonetic || null,
        definition: row.definition || null,
        translation: row.translation || null,
        pos: row.pos || null,
        collins: row.collins ? parseInt(row.collins) : null,
        oxford: row.oxford === 'true' || row.oxford === '1',
        tag: row.tag || null,
        bnc: row.bnc ? parseInt(row.bnc) : null,
        frq: row.frq ? parseInt(row.frq) : null,
        exchange: row.exchange || null,
      });
    })
    .on('end', async () => {
      console.log(`开始导入 ${words.length} 个单词...`);
      
      // 批量插入（每次1000条）
      const batchSize = 1000;
      for (let i = 0; i < words.length; i += batchSize) {
        const batch = words.slice(i, i + batchSize);
        const { error } = await supabase
          .from('words')
          .insert(batch);
        
        if (error) {
          console.error(`批次 ${i / batchSize + 1} 导入失败:`, error);
        } else {
          console.log(`成功导入批次 ${i / batchSize + 1} (${batch.length} 条)`);
        }
      }
      
      console.log('导入完成！');
    });
}

importWords('./path/to/your/words.csv');
```

运行脚本：
```bash
npm install csv-parser
npx ts-node scripts/import-words.ts
```

## 步骤 4: 验证导入

在 SQL Editor 中运行以下查询验证数据：

```sql
-- 查看总数
SELECT COUNT(*) FROM words;

-- 查看一些示例数据
SELECT * FROM words LIMIT 10;

-- 查看高考词汇数量
SELECT COUNT(*) FROM words WHERE tag LIKE '%gk%';

-- 查看牛津核心词汇数量
SELECT COUNT(*) FROM words WHERE oxford = true;

-- 测试随机获取单词
SELECT * FROM get_random_words(5, 'cet4', NULL, NULL);

-- 测试搜索功能
SELECT * FROM search_words('app', 10);
```

## 常见问题

### Q: 导入时出现编码错误
A: 确保 CSV 文件使用 UTF-8 编码保存

### Q: 某些字段有换行符导致解析错误
A: 使用双引号包裹包含换行符或逗号的字段

### Q: 导入后无法查询数据
A: 检查 RLS 策略是否正确设置，确保已登录用户可以读取

### Q: 如何更新已有单词
A: 使用 `UPSERT` 或先删除再导入：
```sql
-- 清空表（谨慎使用！）
TRUNCATE TABLE words;

-- 或使用 ON CONFLICT 更新
INSERT INTO words (...) VALUES (...)
ON CONFLICT (word) DO UPDATE SET ...;
```
