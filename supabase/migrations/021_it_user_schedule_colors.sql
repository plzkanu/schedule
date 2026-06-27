-- IT팀 일정 캘린더: 팀원별 표시 색상

CREATE TABLE IF NOT EXISTS it_user_schedule_colors (
  user_id text PRIMARY KEY,
  color text NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE it_user_schedule_colors DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
