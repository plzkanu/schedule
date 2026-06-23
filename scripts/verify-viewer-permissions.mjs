/**
 * viewer 계정으로 모든 쓰기 API가 403으로 차단되는지 검증합니다.
 * 사용법: npm run dev 실행 후 `npm run verify:permissions`
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3001";
const VIEWER_LOGIN_ID = "viewer1";
const VIEWER_PASSWORD = "viewer123";
const FAKE_PROJECT_ID = "00000000-0000-4000-8000-000000000001";
const FAKE_TASK_ID = "00000000-0000-4000-8000-000000000002";

const WRITE_CASES = [
  {
    name: "POST /api/projects",
    method: "POST",
    path: "/api/projects",
    body: { name: "viewer-test", start_date: "2026-06-01", end_date: "2026-06-30" },
  },
  {
    name: "PATCH /api/projects/[id]",
    method: "PATCH",
    path: `/api/projects/${FAKE_PROJECT_ID}`,
    body: { name: "viewer-test" },
  },
  {
    name: "DELETE /api/projects/[id]",
    method: "DELETE",
    path: `/api/projects/${FAKE_PROJECT_ID}`,
  },
  {
    name: "POST /api/projects/[id]/tasks",
    method: "POST",
    path: `/api/projects/${FAKE_PROJECT_ID}/tasks`,
    body: {
      name: "viewer-task",
      start_date: "2026-06-01",
      end_date: "2026-06-10",
    },
  },
  {
    name: "PATCH /api/projects/[id]/tasks/[taskId]",
    method: "PATCH",
    path: `/api/projects/${FAKE_PROJECT_ID}/tasks/${FAKE_TASK_ID}`,
    body: { start_date: "2026-06-01", end_date: "2026-06-10" },
  },
  {
    name: "DELETE /api/projects/[id]/tasks/[taskId]",
    method: "DELETE",
    path: `/api/projects/${FAKE_PROJECT_ID}/tasks/${FAKE_TASK_ID}`,
  },
  {
    name: "POST /api/admin/users (admin only)",
    method: "POST",
    path: "/api/admin/users",
    body: {
      id: "viewer-test-user",
      name: "viewer-test",
      email: "viewer-test@example.com",
      password: "test1234",
      role: "viewer",
    },
  },
  {
    name: "GET /api/admin/users (admin only)",
    method: "GET",
    path: "/api/admin/users",
  },
  {
    name: "PATCH /api/admin/users/[id] (admin only)",
    method: "PATCH",
    path: "/api/admin/users/admin",
    body: { role: "member" },
  },
  {
    name: "DELETE /api/admin/users/[id] (admin only)",
    method: "DELETE",
    path: "/api/admin/users/admin",
  },
];

function extractSessionCookie(setCookieHeader) {
  if (!setCookieHeader) {
    return null;
  }

  const headers = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];

  for (const header of headers) {
    const match = header.match(/it_schedule_session=([^;]+)/);
    if (match) {
      return `it_schedule_session=${match[1]}`;
    }
  }

  return null;
}

async function loginViewer() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: VIEWER_LOGIN_ID,
      password: VIEWER_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error(`viewer 로그인 실패: HTTP ${response.status}`);
  }

  const cookie = extractSessionCookie(response.headers.getSetCookie?.() ??
    response.headers.get("set-cookie"));

  if (!cookie) {
    throw new Error("세션 쿠키를 받지 못했습니다.");
  }

  return cookie;
}

async function requestWithCookie(cookie, { method, path, body }) {
  return fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function main() {
  console.log(`[verify] BASE_URL=${BASE_URL}`);

  let cookie;
  try {
    cookie = await loginViewer();
    console.log("[verify] viewer 로그인 성공");
  } catch (error) {
    console.error(`[verify] ${error.message}`);
    console.error("[verify] npm run dev 실행 후 다시 시도하세요.");
    process.exit(1);
  }

  let failed = 0;

  for (const testCase of WRITE_CASES) {
    const response = await requestWithCookie(cookie, testCase);
    const ok = response.status === 403;

    if (ok) {
      console.log(`[PASS] ${testCase.name} -> 403`);
    } else {
      failed += 1;
      const text = await response.text();
      console.error(
        `[FAIL] ${testCase.name} -> ${response.status} (expected 403) ${text.slice(0, 120)}`,
      );
    }
  }

  const readResponse = await requestWithCookie(cookie, {
    method: "GET",
    path: "/api/auth/me",
  });

  if (readResponse.ok) {
    console.log("[PASS] GET /api/auth/me -> 200 (조회 허용)");
  } else {
    failed += 1;
    console.error(
      `[FAIL] GET /api/auth/me -> ${readResponse.status} (expected 200)`,
    );
  }

  if (failed > 0) {
    console.error(`\n[verify] ${failed}건 실패`);
    process.exit(1);
  }

  console.log("\n[verify] viewer 쓰기 차단 검증 완료 (모든 항목 PASS)");
}

main().catch((error) => {
  console.error("[verify] unexpected error", error);
  process.exit(1);
});
