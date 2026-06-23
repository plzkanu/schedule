-- 태스크 비고(상세 내용)
ALTER TABLE it_tasks
  ADD COLUMN IF NOT EXISTS notes text;

NOTIFY pgrst, 'reload schema';
