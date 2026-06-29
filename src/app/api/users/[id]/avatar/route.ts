import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { canManageUsers } from "@/lib/auth-permissions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SessionUser } from "@/lib/types";
import { deleteUserAvatar, uploadUserAvatar } from "@/lib/user-avatars";

interface RouteContext {
  params: { id: string };
}

function canModifyAvatar(session: SessionUser, targetUserId: string) {
  return session.id === targetUserId || canManageUsers(session);
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) {
    return session;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase 설정이 필요합니다." },
      { status: 503 },
    );
  }

  if (!canModifyAvatar(session, params.id)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "업로드할 이미지를 선택해 주세요." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { avatarUrl, error } = await uploadUserAvatar(
      params.id,
      buffer,
      file.type,
    );

    if (error) {
      const status =
        error.includes("512KB") ||
        error.includes("JPEG") ||
        error.includes("선택")
          ? 400
          : 500;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ avatarUrl });
  } catch {
    return NextResponse.json(
      { error: "이미지 업로드 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) {
    return session;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase 설정이 필요합니다." },
      { status: 503 },
    );
  }

  if (!canModifyAvatar(session, params.id)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { error } = await deleteUserAvatar(params.id);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
