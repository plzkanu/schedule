import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { toPublicUser, type UserRole } from "@/lib/types";
import { createUser, getAllUsers } from "@/lib/users-store";

export async function GET() {
  const session = await requireApiAdmin();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const users = await getAllUsers();
    return NextResponse.json({
      users: users.map(toPublicUser),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "사용자 목록 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireApiAdmin();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
      department?: string;
    };

    const user = await createUser({
      id: body.id ?? "",
      name: body.name ?? "",
      email: body.email ?? "",
      password: body.password ?? "",
      role: body.role ?? "member",
      department: body.department,
    });

    return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "사용자 등록에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
