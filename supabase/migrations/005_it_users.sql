-- IT 프로젝트 현황 및 일정관리: 앱 사용자 (커스텀 인증)

CREATE TABLE it_users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member', 'viewer')) DEFAULT 'member',
  department text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_it_users_email ON it_users (email);
CREATE INDEX idx_it_users_role ON it_users (role);

-- 서버 전용 테이블: Next.js API(Service Role)에서만 접근하므로 RLS 미사용

-- 초기 사용자 (비밀번호: admin123 / member123 / viewer123 — bidding hskim은 기존 해시)
INSERT INTO it_users (id, name, email, password_hash, role, department) VALUES
  ('admin', '시스템 관리자', 'admin@soosan.com', '$2b$10$m6fqr16mquxvwCMKbwAaJOT.aqijUPO6YikbQNpn8U0tV2zLE6OY.', 'admin', 'IT팀'),
  ('hskim', '김형성', 'hskim@soosan.com', '$2b$10$tr9XIbIhTIhPtMdp5FtN7.41AYMirAn69GliycqjGDY8ASBWPYknW', 'admin', 'IT팀'),
  ('member1', '김개발', 'member@soosan.com', '$2b$10$pHNfB9KK/bnSpV/oCRIB7OrAF6/Mt/ehdY9d1AyierGD8EKX5Hrli', 'member', 'IT팀'),
  ('viewer1', '이경영', 'viewer@soosan.com', '$2b$10$5LrGsMTdrVdtKCURmRlzvexmdCZD5IIYHqhj6.v75xSz65ZDbTCua', 'viewer', '경영진')
ON CONFLICT (id) DO NOTHING;
