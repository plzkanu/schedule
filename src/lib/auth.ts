import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createSessionToken,
  parseSessionToken,
  SESSION_COOKIE,
} from "./session-token";
import type { SessionUser, UserRole } from "./types";
import { toSessionUser } from "./types";
import { findUserById } from "./users-store";

const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

export async function attachSessionCookie(
  response: NextResponse,
  user: SessionUser,
) {
  const token = await createSessionToken(user);
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
}

export async function setSessionCookie(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE,
    await createSessionToken(user),
    sessionCookieOptions,
  );
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const session = await parseSessionToken(token);
  if (!session) {
    return null;
  }

  try {
    const user = await findUserById(session.id);
    if (!user) {
      return null;
    }
    return toSessionUser(user);
  } catch {
    return session;
  }
}

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
