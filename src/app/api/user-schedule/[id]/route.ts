import { NextResponse } from "next/server";
import { requireApiSession, requireApiWriter } from "@/lib/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  canModifyUserScheduleEntry,
  canViewUserScheduleEntry,
} from "@/lib/user-schedule-access";
import {
  deleteUserScheduleEntry,
  getUserScheduleEntry,
  upsertUserScheduleEntry,
} from "@/lib/user-schedule";
import type {
  UserScheduleEntryInput,
  UserScheduleEntryType,
} from "@/lib/user-schedule-types";

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
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

  const { data, error } = await getUserScheduleEntry(params.id);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "일정을 찾을 수 없습니다." }, { status: 404 });
  }
  if (!canViewUserScheduleEntry(session, data)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  return NextResponse.json({ item: data });
}

export async function PATCH(request: Request, { params }: RouteContext) {
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

  const existing = await getUserScheduleEntry(params.id);
  if (existing.error) {
    return NextResponse.json({ error: existing.error }, { status: 500 });
  }
  if (!existing.data) {
    return NextResponse.json({ error: "일정을 찾을 수 없습니다." }, { status: 404 });
  }
  if (!canModifyUserScheduleEntry(session, existing.data)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Partial<UserScheduleEntryInput>;
    const { data, error } = await upsertUserScheduleEntry(existing.data.user_id, {
      schedule_date: body.schedule_date ?? existing.data.schedule_date,
      entry_type: (body.entry_type ?? existing.data.entry_type) as UserScheduleEntryType,
      note: body.note ?? existing.data.note ?? undefined,
    });

    if (error) {
      const status =
        error.includes("형식") || error.includes("선택") ? 400 : 500;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json(
      { error: "일정 수정 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
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

  const existing = await getUserScheduleEntry(params.id);
  if (existing.error) {
    return NextResponse.json({ error: existing.error }, { status: 500 });
  }
  if (!existing.data) {
    return NextResponse.json({ error: "일정을 찾을 수 없습니다." }, { status: 404 });
  }
  if (!canModifyUserScheduleEntry(session, existing.data)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { error } = await deleteUserScheduleEntry(params.id);

  if (error) {
    const status = error.includes("찾을 수 없") ? 404 : 500;
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ ok: true });
}
