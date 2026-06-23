-- 프로젝트화 이전 검토 현황 관리

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

NOTIFY pgrst, 'reload schema';
