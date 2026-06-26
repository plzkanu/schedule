-- 주간업무 관리자 코멘트 및 읽음 추적

CREATE TABLE IF NOT EXISTS it_weekly_work_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_work_id uuid NOT NULL REFERENCES it_weekly_work (id) ON DELETE CASCADE,
  author_id text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT it_weekly_work_comments_content_not_empty CHECK (btrim(content) <> '')
);

CREATE INDEX IF NOT EXISTS idx_it_weekly_work_comments_work_id
  ON it_weekly_work_comments (weekly_work_id, created_at);

CREATE TABLE IF NOT EXISTS it_weekly_work_reads (
  weekly_work_id uuid NOT NULL REFERENCES it_weekly_work (id) ON DELETE CASCADE,
  user_id text NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (weekly_work_id, user_id)
);

ALTER TABLE it_weekly_work_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE it_weekly_work_reads DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
