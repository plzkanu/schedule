import { NextResponse } from "next/server";
import { requireApiSession, requireApiWriter } from "@/lib/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  isValidScheduleColor,
  listUserScheduleColors,
  upsertUserScheduleColor,
} from "@/lib/user-schedule-colors";

export async function GET() {
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

  const { data, error } = await listUserScheduleColors();

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ colors: data });
}

export async function PUT(request: Request) {
  const session = await requireApiWriter();
  if (session instanceof NextResponse) {
    return session;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase 설정이 필요합니다." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      user_id?: string;
      color?: string;
    };

    const userId = body.user_id?.trim() ?? "";
    const color = body.color?.trim() ?? "";

    if (!userId) {
      return NextResponse.json(
        { error: "사용자를 지정해 주세요." },
        { status: 400 },
      );
    }

    if (!isValidScheduleColor(color)) {
      return NextResponse.json(
        { error: "색상 형식이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const { error } = await upsertUserScheduleColor(userId, color);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, user_id: userId, color });
  } catch {
    return NextResponse.json(
      { error: "색상 저장 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
