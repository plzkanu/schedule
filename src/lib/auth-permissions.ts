import type { SessionUser, UserRole } from "./types";

/** 역할이 admin인 모든 사용자 (아이디 admin 계정에 한정되지 않음) */
export function canManageUsers(
  session: SessionUser | null,
): session is SessionUser {
  return session?.role === "admin";
}

export function isAdmin(session: SessionUser | null): session is SessionUser {
  return canManageUsers(session);
}

export function canWrite(session: SessionUser | null): session is SessionUser {
  return session?.role === "admin" || session?.role === "member";
}

export function hasRole(
  session: SessionUser | null,
  ...roles: UserRole[]
): session is SessionUser {
  return session !== null && roles.includes(session.role);
}
