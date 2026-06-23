-- it_tech_capabilities: Next.js 서버(Service Role) API 전용
-- RLS만 켜고 정책이 없으면 INSERT/UPDATE/DELETE가 차단됩니다.

ALTER TABLE it_tech_capabilities DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
