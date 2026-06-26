-- 주간업무 코멘트 답글(스레드) 구조

ALTER TABLE it_weekly_work_comments
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES it_weekly_work_comments (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_it_weekly_work_comments_parent_id
  ON it_weekly_work_comments (parent_id);

NOTIFY pgrst, 'reload schema';
