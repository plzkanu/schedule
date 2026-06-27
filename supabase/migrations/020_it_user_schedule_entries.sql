-- IT팀 외근·휴가 일정

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

NOTIFY pgrst, 'reload schema';
