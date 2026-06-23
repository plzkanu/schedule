import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createSessionToken,
  parseSessionToken,
  SESSION_COOKIE,
} from "./session-token";
import type { SessionUser } from "./types";
import { toSessionUser } from "./types";
import { findUserById } from "./users-store";

export {
  canManageUsers,
  canWrite,
  hasRole,
  isAdmin,
} from "./auth-permissions";

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
