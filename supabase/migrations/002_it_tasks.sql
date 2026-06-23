-- IT 프로젝트 현황 및 일정관리: 태스크 (Gantt 타임라인 단위)

CREATE TABLE it_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES it_projects (id) ON DELETE CASCADE,
  parent_task_id uuid REFERENCES it_tasks (id) ON DELETE CASCADE,
  name text NOT NULL,
  notes text,
  assignee_id text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('계획', '진행중', '보류', '완료', '지연')) DEFAULT '계획',
  progress int NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  is_group boolean NOT NULL DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_it_tasks_project_id ON it_tasks (project_id);
CREATE INDEX idx_it_tasks_parent_task_id ON it_tasks (parent_task_id);
CREATE INDEX idx_it_tasks_assignee_id ON it_tasks (assignee_id);
