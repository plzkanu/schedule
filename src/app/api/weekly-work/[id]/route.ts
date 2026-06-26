import { NextResponse } from "next/server";
import { requireApiSession, requireApiWriter } from "@/lib/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  canModifyWeeklyWork,
  canViewWeeklyWork,
} from "@/lib/weekly-work-access";
import {
  deleteWeeklyWork,
  getWeeklyWork,
  updateWeeklyWork,
} from "@/lib/weekly-work";
import type { WeeklyWorkInput } from "@/lib/weekly-work-types";

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

  const { data, error } = await getWeeklyWork(params.id);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "주간업무를 찾을 수 없습니다." }, { status: 404 });
  }

  if (!canViewWeeklyWork(session, data)) {
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

  const existing = await getWeeklyWork(params.id);
  if (existing.error) {
    return NextResponse.json({ error: existing.error }, { status: 500 });
  }
  if (!existing.data) {
    return NextResponse.json({ error: "주간업무를 찾을 수 없습니다." }, { status: 404 });
  }
  if (!canModifyWeeklyWork(session, existing.data)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Partial<WeeklyWorkInput>;
    const { data, error } = await updateWeeklyWork(params.id, {
      week_start: body.week_start ?? existing.data.week_start,
      work_type: body.work_type ?? existing.data.work_type,
      project_name: body.project_name,
      content: body.content,
      daily_entries: body.daily_entries,
    });

    if (error) {
      const status =
        error.includes("입력") ||
        error.includes("형식") ||
        error.includes("찾을 수 없")
          ? 400
          : 500;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json(
      { error: "주간업무 수정 처리 중 오류가 발생했습니다." },
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

  const existing = await getWeeklyWork(params.id);
  if (existing.error) {
    return NextResponse.json({ error: existing.error }, { status: 500 });
  }
  if (!existing.data) {
    return NextResponse.json({ error: "주간업무를 찾을 수 없습니다." }, { status: 404 });
  }
  if (!canModifyWeeklyWork(session, existing.data)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { error } = await deleteWeeklyWork(params.id);

  if (error) {
    const status = error.includes("찾을 수 없") ? 404 : 500;
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ ok: true });
}
