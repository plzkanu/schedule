-- IT 기술 확보(내재화) 관리

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

NOTIFY pgrst, 'reload schema';
