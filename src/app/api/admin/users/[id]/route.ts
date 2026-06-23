import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { toPublicUser, type UserRole } from "@/lib/types";
import { deleteUser, updateUser } from "@/lib/users-store";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await requireApiAdmin();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
      department?: string;
    };

    const user = await updateUser(
      params.id,
      {
        name: body.name,
        email: body.email,
        password: body.password,
        role: body.role,
        department: body.department,
      },
      session.id,
    );

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "사용자 수정에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await requireApiAdmin();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    await deleteUser(params.id, session.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "사용자 삭제에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
