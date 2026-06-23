import { NextResponse } from "next/server";
import { attachSessionCookie } from "@/lib/auth";
import { verifyUserCredentials } from "@/lib/users-store";
import { toSessionUser } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      email?: string;
      password?: string;
    };

    const loginId = body.userId?.trim() ?? body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!loginId || !password) {
      return NextResponse.json(
        { error: "아이디와 비밀번호를 입력해 주세요." },
        { status: 400 },
      );
    }

    const user = await verifyUserCredentials(loginId, password);
    if (!user) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    const sessionUser = toSessionUser(user);
    const response = NextResponse.json({ user: sessionUser });
    return attachSessionCookie(response, sessionUser);
  } catch {
    return NextResponse.json(
      { error: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
