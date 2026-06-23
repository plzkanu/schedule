-- 프로젝트 이슈 관리

CREATE TABLE IF NOT EXISTS it_project_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES it_projects (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  severity text NOT NULL CHECK (severity IN ('상', '중', '하')) DEFAULT '중',
  status text NOT NULL CHECK (
    status IN ('신규', '조치중', '해결', '보류')
  ) DEFAULT '신규',
  reporter_id text,
  assignee_id text,
  occurred_date date NOT NULL DEFAULT CURRENT_DATE,
  resolution text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_it_project_issues_project_id
  ON it_project_issues (project_id);
CREATE INDEX IF NOT EXISTS idx_it_project_issues_status
  ON it_project_issues (status);
CREATE INDEX IF NOT EXISTS idx_it_project_issues_severity
  ON it_project_issues (severity);
CREATE INDEX IF NOT EXISTS idx_it_project_issues_occurred_date
  ON it_project_issues (occurred_date DESC);

ALTER TABLE it_project_issues DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
