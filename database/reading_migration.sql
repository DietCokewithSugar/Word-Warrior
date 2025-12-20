-- Create reading_materials table
create table if not exists public.reading_materials (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  category text,
  difficulty text check (difficulty in ('小学', '初中', '高中')),
  -- questions: JSON array of objects. Each object:
  -- {
  --   "question": "text",
  --   "options": ["A", "B", "C", "D"],
  --   "answer": "Correct Option Text",
  --   "explanation": "Chinese explanation"
  -- }
  questions jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.reading_materials enable row level security;

-- Create policy for reading access (allow everyone to read)
create policy "Allow public read access"
  on public.reading_materials
  for select
  using (true);

-- Create policy for insert (allow only authenticated users or admins if needed, for now allowing service role or specific users might be best, but adhering to simple public read for this feature)
-- Assuming admin/seed script usage for writing
create policy "Allow insert for authenticated users only"
  on public.reading_materials
  for insert
  with check (auth.role() = 'authenticated');
