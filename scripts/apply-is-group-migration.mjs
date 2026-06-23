/**
 * it_tasks.is_group 컬럼 마이그레이션 적용
 *
 * 사용법 (둘 중 하나):
 * 1) Supabase 대시보드 → SQL Editor → supabase/migrations/008_it_tasks_is_group.sql 내용 실행
 * 2) DATABASE_URL 설정 후: npm run db:migrate:is-group
 *
 * DATABASE_URL 예: Supabase → Project Settings → Database → Connection string (URI)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = {
  ...loadEnvFile(path.join(process.cwd(), ".env")),
  ...loadEnvFile(path.join(process.cwd(), ".env.local")),
  ...process.env,
};

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/008_it_tasks_is_group.sql",
);
const sql = fs.readFileSync(migrationPath, "utf8");

if (!env.DATABASE_URL) {
  console.error("DATABASE_URL이 설정되어 있지 않습니다.\n");
  console.error("Supabase SQL Editor에서 아래 파일 내용을 실행해 주세요:");
  console.error(`  ${migrationPath}\n`);
  console.error("또는 .env.local에 DATABASE_URL을 추가한 뒤 다시 실행하세요.");
  console.error(
    "(Supabase → Project Settings → Database → Connection string URI)\n",
  );
  console.error("--- SQL 미리보기 ---\n");
  console.error(sql);
  process.exit(1);
}

const { default: pg } = await import("pg");

const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("is_group 마이그레이션이 적용되었습니다.");
} catch (error) {
  console.error("마이그레이션 적용 실패:");
  console.error(error instanceof Error ? error.message : error);
  console.error("\nSupabase SQL Editor에서 008_it_tasks_is_group.sql을 직접 실행해 주세요.");
  process.exit(1);
} finally {
  await client.end();
}
