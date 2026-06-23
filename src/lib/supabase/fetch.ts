import { isSupabaseTlsInsecure } from "./config";

export function formatSupabaseNetworkError(message: string): string {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("fetch failed") ||
    normalized.includes("certificate") ||
    normalized.includes("ssl") ||
    normalized.includes("econnrefused") ||
    normalized.includes("enotfound") ||
    normalized.includes("timeout")
  ) {
    return (
      "Supabase에 연결할 수 없습니다. 회사 VPN/방화벽 환경이면 .env.local에 " +
      "SUPABASE_SSL_VERIFY=0을 추가한 뒤 개발 서버를 재시작하세요."
    );
  }
  if (
    normalized.includes("row-level security") ||
    normalized.includes("row level security")
  ) {
    if (normalized.includes("it_tech_capabilities")) {
      return (
        "it_tech_capabilities 테이블 RLS 정책으로 등록이 차단되었습니다. " +
        "Supabase SQL Editor에서 아래를 실행하세요: " +
        "ALTER TABLE it_tech_capabilities DISABLE ROW LEVEL SECURITY; " +
        "NOTIFY pgrst, 'reload schema'; " +
        "(또는 supabase/migrations/011_it_tech_capabilities_disable_rls.sql 실행)"
      );
    }
    return (
      "it_* 테이블 RLS 정책으로 요청이 차단되었습니다. Supabase SQL Editor에서 " +
      "supabase/migrations/007_it_tables_disable_rls.sql 파일 내용을 실행해 주세요."
    );
  }
  if (
    normalized.includes("it_reviews") &&
    (normalized.includes("schema cache") ||
      normalized.includes("relation") ||
      normalized.includes("does not exist"))
  ) {
    return (
      "it_reviews 테이블이 없습니다. Supabase SQL Editor에서 " +
      "supabase/migrations/013_it_reviews.sql 파일 내용을 실행해 주세요."
    );
  }
  if (
    normalized.includes("it_project_issues") &&
    (normalized.includes("schema cache") ||
      normalized.includes("relation") ||
      normalized.includes("does not exist"))
  ) {
    return (
      "it_project_issues 테이블이 없습니다. Supabase SQL Editor에서 " +
      "supabase/migrations/012_it_project_issues.sql 파일 내용을 실행해 주세요."
    );
  }
  if (
    normalized.includes("it_tech_capabilities") &&
    (normalized.includes("schema cache") ||
      normalized.includes("relation") ||
      normalized.includes("does not exist"))
  ) {
    return (
      "it_tech_capabilities 테이블이 없습니다. Supabase SQL Editor에서 " +
      "supabase/migrations/010_it_tech_capabilities.sql 파일 내용을 실행해 주세요."
    );
  }
  if (
    (normalized.includes("is_group") || normalized.includes("notes")) &&
    (normalized.includes("schema cache") || normalized.includes("column"))
  ) {
    const column = normalized.includes("notes") ? "notes" : "is_group";
    const file =
      column === "notes"
        ? "009_it_tasks_notes.sql"
        : "008_it_tasks_is_group.sql";
    return (
      `it_tasks.${column} 컬럼이 없습니다. Supabase SQL Editor에서 ` +
      `supabase/migrations/${file} 파일 내용을 실행해 주세요.`
    );
  }
  return message;
}

let supabaseTlsBypassApplied = false;

/** Node fetch(HTTPS)가 회사망 OCSP 검사 등으로 실패할 때 Supabase 연결용 */
export function applySupabaseTlsBypassIfConfigured(): void {
  if (supabaseTlsBypassApplied || !isSupabaseTlsInsecure()) {
    return;
  }
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  supabaseTlsBypassApplied = true;
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[supabase] SUPABASE_SSL_VERIFY=0 — TLS 인증서 검증을 생략합니다.",
    );
  }
}
