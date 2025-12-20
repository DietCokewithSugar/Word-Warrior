
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY; // Or SERVICE_ROLE if available, but usually ANON is there.
// Ideally we need service role to bypass policies if anon doesn't have insert rights.
// But for now let's try with what we have. If it fails, I'll ask user for service role or to enable insert.

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const csvPath = path.resolve(__dirname, '../database/reading_materials.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Simple CSV parser handling quoted fields
function parseCSV(text: string) {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (inQuotes) {
            if (char === '"' && nextChar === '"') {
                currentField += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentRow.push(currentField);
                currentField = '';
            } else if (char === '\n' || char === '\r') {
                if (currentField || currentRow.length > 0) {
                    currentRow.push(currentField);
                    rows.push(currentRow);
                    currentRow = [];
                    currentField = '';
                }
                if (char === '\r' && nextChar === '\n') i++;
            } else {
                currentField += char;
            }
        }
    }
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }
    return rows;
}

async function migrate() {
    const rows = parseCSV(csvContent);
    // Remove header
    const headers = rows.shift();

    // Process rows
    // title,content,category,difficulty,questions
    // questions is a JSON string in the CSV

    const articles = rows.map(row => {
        if (row.length < 5) return null;
        try {
            return {
                title: row[0],
                content: row[1],
                category: row[2],
                difficulty: row[3],
                questions: JSON.parse(row[4].replace(/""/g, '"')) // Unescape double quotes if needed, though my parser might have handled it.
                // Wait, my parser handled " " -> " inside quotes.
                // The CSV file has questions as "[{""question"": ... }]" which implies CSV double quoting.
                // My parser converts "" to " inside quotes, so the result string `row[4]` should be valid JSON: `[{"question": ... }]`.
            };
        } catch (e) {
            console.error('Failed to parse row:', row[0], e);
            return null;
        }
    }).filter(a => a !== null);

    console.log(`Found ${articles.length} articles to migrate.`);

    for (const article of articles) {
        const { error } = await supabase
            .from('reading_articles')
            .insert(article);

        if (error) {
            console.error(`Error inserting ${article.title}:`, error);
        } else {
            console.log(`Inserted ${article.title}`);
        }
    }
}

migrate();
