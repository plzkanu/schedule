-- IT팀 주간업무 등록

CREATE TABLE IF NOT EXISTS it_weekly_work (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  week_start date NOT NULL,
  work_type text NOT NULL CHECK (work_type IN ('project', 'misc')),
  project_name text,
  content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT it_weekly_work_type_fields CHECK (
    (
      work_type = 'project'
      AND project_name IS NOT NULL
      AND btrim(project_name) <> ''
    )
    OR (
      work_type = 'misc'
      AND content IS NOT NULL
      AND btrim(content) <> ''
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_it_weekly_work_user_id ON it_weekly_work (user_id);
CREATE INDEX IF NOT EXISTS idx_it_weekly_work_week_start ON it_weekly_work (week_start DESC);
CREATE INDEX IF NOT EXISTS idx_it_weekly_work_work_type ON it_weekly_work (work_type);

ALTER TABLE it_weekly_work DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
