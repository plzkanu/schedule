# IT 프로젝트 현황 및 일정관리 시스템

사내 IT팀 프로젝트 현황·일정을 관리하는 웹 애플리케이션입니다.  
기존 SOOSAN 입찰·견적 시스템과 동일한 Supabase 연동 패턴(Service Role Key, 서버 전용)을 사용합니다.

## 기술 스택

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- Supabase PostgreSQL
- recharts, gantt-task-react, date-fns

## 환경 변수

`.env.local.example`을 복사해 `.env.local`을 만든 뒤 값을 채웁니다.

```bash
cp .env.local.example .env.local
```

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key (서버 전용, 클라이언트 노출 금지) |
| `SUPABASE_SSL_VERIFY` | VPN/방화벽 환경에서 TLS 오류 시 `0` (개발 전용) |
| `AUTH_SECRET` | 세션 쿠키 서명용 시크릿 |

## Supabase 마이그레이션

`supabase/migrations/` 폴더의 SQL을 Supabase SQL Editor에서 **001 → 005 순서**로 실행합니다.

- `001_it_projects.sql` — 프로젝트
- `002_it_tasks.sql` — 태스크
- `003_it_task_dependencies.sql` — 태스크 의존 관계
- `004_it_activity_logs.sql` — 활동 이력 + RLS 활성화
- `005_it_users.sql` — 앱 사용자 (로그인·역할 관리)
- `006_it_users_disable_rls.sql` — `it_users` RLS 해제 (005 적용 후 INSERT 오류 시)
- `007_it_tables_disable_rls.sql` — `it_*` 전체 테이블 RLS 해제 (프로젝트 CRUD 오류 시)

테이블명은 `it_` 접두사를 사용해 기존 `khnp_bid_*` 테이블과 충돌하지 않습니다.

**한 번에 적용:** `supabase/apply-all-migrations.sql` 전체를 SQL Editor에 붙여넣어 실행해도 됩니다.

### `Could not find the table 'public.it_projects'`

Supabase 프로젝트에 `it_*` 테이블이 아직 없을 때 발생합니다.

1. [Supabase Dashboard](https://supabase.com/dashboard) → 해당 프로젝트 → **SQL Editor**
2. `supabase/apply-all-migrations.sql` 내용 붙여넣기 → **Run**
3. **Table Editor**에서 `it_projects` 등 5개 테이블 생성 확인
4. 그래도 동일하면 **Project Settings → API → Reload schema** (또는 1~2분 후 재시도)
5. `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`이 **테이블을 만든 그 프로젝트**와 같은지 확인

개발 서버 재시작: `npm run dev`

### `new row violates row-level security policy for table "it_*"`

`it_projects`, `it_tasks`, `it_users` 등 `it_*` 테이블에 RLS만 켜져 있고 정책이 없을 때 INSERT/UPDATE/DELETE가 차단됩니다. Supabase SQL Editor에서 아래를 실행하세요.

```sql
ALTER TABLE it_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE it_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE it_task_dependencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE it_activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE it_users DISABLE ROW LEVEL SECURITY;
NOTIFY pgrst, 'reload schema';
```

또는 `supabase/migrations/007_it_tables_disable_rls.sql` 파일 내용을 실행합니다.

## 인증

Supabase Auth는 사용하지 않습니다. **Supabase `it_users` 테이블**에 사용자를 저장하고, bcrypt + AUTH_SECRET 세션 쿠키로 로그인합니다.

| 역할 | 아이디 | 비밀번호 | 권한 |
|------|--------|----------|------|
| admin | admin | admin123 | 전체 + 사용자 관리 |
| admin | hskim | (입찰 시스템과 동일) | admin · IT팀 |
| member | member1 | member123 | 프로젝트/태스크 CRUD |
| viewer | viewer1 | viewer123 | 조회 전용 |

아이디 또는 이메일(`hskim@soosan.com` 등) 모두 로그인에 사용할 수 있습니다.

`middleware.ts`에서 `/dashboard`, `/projects`, `/admin` 경로를 보호합니다.

## 개발 서버

```bash
npm install
npm run dev
```

http://localhost:3001

개발 서버 포트는 `package.json`의 `npm run dev`에서 **3001**로 설정되어 있습니다. 변경하려면 `-p` 값을 수정하세요.

## Supabase 연동 구조

- `src/lib/supabase/config.ts` — 설정 검사
- `src/lib/supabase/server.ts` — Service Role 클라이언트 생성
- `src/lib/supabase/fetch.ts` — TLS 우회·네트워크 오류 메시지

Supabase 미설정 시 `SupabaseConfigAlert` 컴포넌트로 안내합니다.

## 사용자 관리 (admin)

`/admin/users` — admin 계정만 접근 가능합니다. 사용자 **등록·수정**(아이디, 이름, 이메일, 비밀번호, 역할, 부서)이 가능하며 Supabase `it_users` 테이블에 저장됩니다.

- API: `GET /api/admin/users`, `POST /api/admin/users`, `PATCH /api/admin/users/[id]`, `DELETE /api/admin/users/[id]`
- 관리자가 한 명뿐일 때 역할 변경·삭제 불가
- 본인 admin 권한 해제·본인 계정 삭제 불가
- 아이디는 등록 후 변경 불가

## viewer 권한 검증

개발 서버 실행 후 viewer 계정의 쓰기 API 차단을 자동 검증합니다.

```bash
npm run dev
npm run verify:permissions
```

검증 항목: 프로젝트/태스크 POST·PATCH·DELETE, admin 사용자 API → **403** / `GET /api/auth/me` → **200**
