import { NextResponse } from "next/server";
import { canManageUsers, canWrite } from "./auth-permissions";
import { getSessionUser } from "./auth";
import type { SessionUser } from "./types";

export async function getApiSession(): Promise<SessionUser | null> {
  return getSessionUser();
}

export function unauthorizedResponse(message = "로그인이 필요합니다.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "권한이 없습니다.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function requireApiSession(): Promise<
  SessionUser | NextResponse
> {
  const session = await getApiSession();
  if (!session) {
    return unauthorizedResponse();
  }
  return session;
}

export async function requireApiAdmin(): Promise<
  SessionUser | NextResponse
> {
  const session = await getApiSession();
  if (!session) {
    return unauthorizedResponse();
  }
  if (!canManageUsers(session)) {
    return forbiddenResponse("관리자 역할만 접근할 수 있습니다.");
  }
  return session;
}

export async function requireApiWriter(): Promise<
  SessionUser | NextResponse
> {
  const session = await getApiSession();
  if (!session) {
    return unauthorizedResponse();
  }
  if (!canWrite(session)) {
    return forbiddenResponse("조회 전용 계정은 변경할 수 없습니다.");
  }
  return session;
}
