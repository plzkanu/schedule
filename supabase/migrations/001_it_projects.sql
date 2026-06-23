-- IT 프로젝트 현황 및 일정관리: 프로젝트 마스터

CREATE TABLE it_projects (
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

CREATE INDEX idx_it_projects_status ON it_projects (status);
CREATE INDEX idx_it_projects_owner_id ON it_projects (owner_id);
CREATE INDEX idx_it_projects_end_date ON it_projects (end_date);
