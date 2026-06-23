-- IT 프로젝트 현황 및 일정관리: 태스크 선후행 의존 관계

CREATE TABLE it_task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES it_tasks (id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES it_tasks (id) ON DELETE CASCADE,
  UNIQUE (task_id, depends_on_task_id),
  CHECK (task_id <> depends_on_task_id)
);

CREATE INDEX idx_it_task_dependencies_task_id ON it_task_dependencies (task_id);
CREATE INDEX idx_it_task_dependencies_depends_on ON it_task_dependencies (depends_on_task_id);
