-- 주간업무 담당자 응답 상태 (검토/진행/완료/반려)

ALTER TABLE it_weekly_work_comments
  ADD COLUMN IF NOT EXISTS status text CHECK (
    status IS NULL
    OR status IN ('review', 'in_progress', 'completed', 'rejected')
  );

ALTER TABLE it_weekly_work_comments
  DROP CONSTRAINT IF EXISTS it_weekly_work_comments_content_not_empty;

ALTER TABLE it_weekly_work_comments
  ADD CONSTRAINT it_weekly_work_comments_content_not_empty CHECK (
    btrim(content) <> ''
    OR status IS NOT NULL
  );

NOTIFY pgrst, 'reload schema';
