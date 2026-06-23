-- it_users: Next.js 서버(Service Role)에서만 접근 — RLS 비활성화
-- (RLS만 켜고 정책이 없으면 PostgREST INSERT/SELECT가 차단됩니다)

ALTER TABLE it_users DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
