-- 주간업무 요일별 내용 (yyyy-MM-dd -> text)

ALTER TABLE it_weekly_work
  ADD COLUMN IF NOT EXISTS daily_entries jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE it_weekly_work DROP CONSTRAINT IF EXISTS it_weekly_work_type_fields;

ALTER TABLE it_weekly_work ADD CONSTRAINT it_weekly_work_type_fields CHECK (
  (
    work_type = 'project'
    AND project_name IS NOT NULL
    AND btrim(project_name) <> ''
  )
  OR (
    work_type = 'misc'
    AND (
      (content IS NOT NULL AND btrim(content) <> '')
      OR (
        daily_entries IS NOT NULL
        AND daily_entries <> '{}'::jsonb
      )
    )
  )
);

NOTIFY pgrst, 'reload schema';
