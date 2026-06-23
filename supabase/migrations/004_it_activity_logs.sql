-- IT 프로젝트 현황 및 일정관리: 활동 이력 (대시보드·프로젝트 상세 타임라인)

CREATE TABLE it_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES it_projects (id) ON DELETE CASCADE,
  task_id uuid REFERENCES it_tasks (id) ON DELETE CASCADE,
  user_id text,
  action text NOT NULL,
  content text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_it_activity_logs_project_id ON it_activity_logs (project_id);
CREATE INDEX idx_it_activity_logs_task_id ON it_activity_logs (task_id);
CREATE INDEX idx_it_activity_logs_created_at ON it_activity_logs (created_at DESC);

-- RLS: Service Role Key는 RLS를 우회하므로 API Route에서 권한 통제.
-- PostgREST(Service Role 클라이언트) 사용 시 정책 없이 ENABLE 하면 CRUD가 차단됩니다.
ALTER TABLE it_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE it_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE it_task_dependencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE it_activity_logs DISABLE ROW LEVEL SECURITY;
