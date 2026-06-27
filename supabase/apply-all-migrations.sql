-- IT 일정관리 시스템 — 전체 마이그레이션 (Supabase SQL Editor에서 1회 실행)
-- 이미 테이블이 있으면 해당 CREATE 문은 건너뛰거나, 에러 난 구문만 제외하고 실행하세요.

-- 001 it_projects
CREATE TABLE IF NOT EXISTS it_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('계획', '진행중', '보류', '완료', '지연')) DEFAULT '계획',
  priority text NOT NULL CHECK (priority IN ('상', '중', '하')) DEFAULT '중',
  start_date date NOT NULL,
  end_date date NOT NULL,
  progress int NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  owner_id text,
  department text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_it_projects_status ON it_projects (status);
CREATE INDEX IF NOT EXISTS idx_it_projects_owner_id ON it_projects (owner_id);
CREATE INDEX IF NOT EXISTS idx_it_projects_end_date ON it_projects (end_date);

-- 002 it_tasks
CREATE TABLE IF NOT EXISTS it_tasks (
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

CREATE INDEX IF NOT EXISTS idx_it_tasks_project_id ON it_tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_it_tasks_parent_task_id ON it_tasks (parent_task_id);
CREATE INDEX IF NOT EXISTS idx_it_tasks_assignee_id ON it_tasks (assignee_id);

-- 003 it_task_dependencies
CREATE TABLE IF NOT EXISTS it_task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES it_tasks (id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES it_tasks (id) ON DELETE CASCADE,
  UNIQUE (task_id, depends_on_task_id),
  CHECK (task_id <> depends_on_task_id)
);

CREATE INDEX IF NOT EXISTS idx_it_task_dependencies_task_id ON it_task_dependencies (task_id);
CREATE INDEX IF NOT EXISTS idx_it_task_dependencies_depends_on ON it_task_dependencies (depends_on_task_id);

-- 004 it_activity_logs + RLS
CREATE TABLE IF NOT EXISTS it_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES it_projects (id) ON DELETE CASCADE,
  task_id uuid REFERENCES it_tasks (id) ON DELETE CASCADE,
  user_id text,
  action text NOT NULL,
  content text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_it_activity_logs_project_id ON it_activity_logs (project_id);
CREATE INDEX IF NOT EXISTS idx_it_activity_logs_task_id ON it_activity_logs (task_id);
CREATE INDEX IF NOT EXISTS idx_it_activity_logs_created_at ON it_activity_logs (created_at DESC);

-- RLS: Next.js Service Role API 전용 — PostgREST 사용 시 정책 없이 ENABLE 하면 CRUD 차단됨
ALTER TABLE it_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE it_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE it_task_dependencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE it_activity_logs DISABLE ROW LEVEL SECURITY;

-- 005 it_users
CREATE TABLE IF NOT EXISTS it_users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member', 'viewer')) DEFAULT 'member',
  department text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_it_users_email ON it_users (email);
CREATE INDEX IF NOT EXISTS idx_it_users_role ON it_users (role);

-- 서버 전용 테이블: RLS 미사용 (정책 없이 RLS ON 시 PostgREST에서 INSERT 차단됨)
ALTER TABLE it_users DISABLE ROW LEVEL SECURITY;

INSERT INTO it_users (id, name, email, password_hash, role, department) VALUES
  ('admin', '시스템 관리자', 'admin@soosan.com', '$2b$10$m6fqr16mquxvwCMKbwAaJOT.aqijUPO6YikbQNpn8U0tV2zLE6OY.', 'admin', 'IT팀'),
  ('hskim', '김형성', 'hskim@soosan.com', '$2b$10$tr9XIbIhTIhPtMdp5FtN7.41AYMirAn69GliycqjGDY8ASBWPYknW', 'admin', 'IT팀'),
  ('member1', '김개발', 'member@soosan.com', '$2b$10$pHNfB9KK/bnSpV/oCRIB7OrAF6/Mt/ehdY9d1AyierGD8EKX5Hrli', 'member', 'IT팀'),
  ('viewer1', '이경영', 'viewer@soosan.com', '$2b$10$5LrGsMTdrVdtKCURmRlzvexmdCZD5IIYHqhj6.v75xSz65ZDbTCua', 'viewer', '경영진')
ON CONFLICT (id) DO NOTHING;

-- 008 it_tasks.is_group (기존 DB에 컬럼이 없을 때)
ALTER TABLE it_tasks
  ADD COLUMN IF NOT EXISTS is_group boolean NOT NULL DEFAULT false;

UPDATE it_tasks AS parent
SET is_group = true
WHERE EXISTS (
  SELECT 1 FROM it_tasks AS child
  WHERE child.parent_task_id = parent.id
);

-- 009 it_tasks.notes (기존 DB에 컬럼이 없을 때)
ALTER TABLE it_tasks
  ADD COLUMN IF NOT EXISTS notes text;

-- 010 it_tech_capabilities (기술 확보 / 내재화 관리)
CREATE TABLE IF NOT EXISTS it_tech_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (
    category IN ('AI', '클라우드', '개발플랫폼', '데이터', '보안', '업무자동화', '기타')
  ) DEFAULT '기타',
  maturity text NOT NULL CHECK (
    maturity IN ('탐색', '학습', '파일럿', '확산', '내재화완료')
  ) DEFAULT '탐색',
  status text NOT NULL CHECK (
    status IN ('계획', '진행중', '보류', '완료', '지연')
  ) DEFAULT '계획',
  priority text NOT NULL CHECK (priority IN ('상', '중', '하')) DEFAULT '중',
  start_date date NOT NULL,
  target_date date NOT NULL,
  progress int NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  owner_id text,
  department text,
  use_cases text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_it_tech_capabilities_category
  ON it_tech_capabilities (category);
CREATE INDEX IF NOT EXISTS idx_it_tech_capabilities_maturity
  ON it_tech_capabilities (maturity);
CREATE INDEX IF NOT EXISTS idx_it_tech_capabilities_status
  ON it_tech_capabilities (status);
CREATE INDEX IF NOT EXISTS idx_it_tech_capabilities_owner_id
  ON it_tech_capabilities (owner_id);

ALTER TABLE it_tech_capabilities DISABLE ROW LEVEL SECURITY;

-- 012 it_project_issues (프로젝트 이슈 관리)
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

-- 013 it_reviews (프로젝트화 이전 검토 관리)
CREATE TABLE IF NOT EXISTS it_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (
    category IN ('시스템개발', '인프라', '업무개선', 'AI/데이터', '보안', '기타')
  ) DEFAULT '기타',
  status text NOT NULL CHECK (
    status IN ('접수', '검토중', '보완요청', '승인대기', '보류', '반려', '프로젝트화')
  ) DEFAULT '접수',
  priority text NOT NULL CHECK (priority IN ('상', '중', '하')) DEFAULT '중',
  request_department text,
  requester_id text,
  reviewer_id text,
  requested_date date NOT NULL DEFAULT CURRENT_DATE,
  target_date date NOT NULL,
  review_summary text,
  scope text,
  notes text,
  project_id uuid REFERENCES it_projects (id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_it_reviews_status ON it_reviews (status);
CREATE INDEX IF NOT EXISTS idx_it_reviews_category ON it_reviews (category);
CREATE INDEX IF NOT EXISTS idx_it_reviews_priority ON it_reviews (priority);
CREATE INDEX IF NOT EXISTS idx_it_reviews_reviewer_id ON it_reviews (reviewer_id);
CREATE INDEX IF NOT EXISTS idx_it_reviews_target_date ON it_reviews (target_date);
CREATE INDEX IF NOT EXISTS idx_it_reviews_project_id ON it_reviews (project_id);

ALTER TABLE it_reviews DISABLE ROW LEVEL SECURITY;

-- 014 it_weekly_work (IT팀 주간업무)
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

-- 015 it_weekly_work_comments (관리자 코멘트·읽음 추적)
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

-- 016 it_weekly_work daily_entries (요일별 업무 내용)
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

-- 017 it_weekly_work_comments status (담당자 응답 상태)
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

-- 018 it_weekly_work_comments parent_id (답글 스레드)
ALTER TABLE it_weekly_work_comments
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES it_weekly_work_comments (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_it_weekly_work_comments_parent_id
  ON it_weekly_work_comments (parent_id);

-- 019 daily_entries plan/actual/overtime (JSON 구조 문서화, 스키마 변경 없음)

-- 020 it_user_schedule_entries (외근·휴가)
CREATE TABLE IF NOT EXISTS it_user_schedule_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  schedule_date date NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('business_trip', 'vacation')),
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, schedule_date)
);

CREATE INDEX IF NOT EXISTS idx_it_user_schedule_entries_date
  ON it_user_schedule_entries (schedule_date);

CREATE INDEX IF NOT EXISTS idx_it_user_schedule_entries_user_id
  ON it_user_schedule_entries (user_id);

ALTER TABLE it_user_schedule_entries DISABLE ROW LEVEL SECURITY;

-- 021 it_user_schedule_colors (팀원별 표시 색상)
CREATE TABLE IF NOT EXISTS it_user_schedule_colors (
  user_id text PRIMARY KEY,
  color text NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE it_user_schedule_colors DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
