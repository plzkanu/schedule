/**
 * Replit/프로덕션용 Next.js 시작 스크립트.
 * .replit [[ports]] localPort(3001)와 동일한 포트에 0.0.0.0으로 바인딩합니다.
 */
import { spawn } from "node:child_process";

const REPLIT_LOCAL_PORT = "3001";
const port = process.env.PORT ?? REPLIT_LOCAL_PORT;
const command = process.platform === "win32" ? "npx.cmd" : "npx";
const args = ["next", "start", "--hostname", "0.0.0.0", "--port", port];

const child = spawn(command, args, {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
