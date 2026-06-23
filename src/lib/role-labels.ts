import type { UserRole } from "./types";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "관리자",
  member: "IT팀원",
  viewer: "경영진(조회)",
};

export const ROLE_OPTIONS: UserRole[] = ["admin", "member", "viewer"];
