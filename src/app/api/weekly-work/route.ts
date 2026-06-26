import { NextResponse } from "next/server";
import { requireApiSession, requireApiWriter } from "@/lib/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { scopeWeeklyWorkFilters } from "@/lib/weekly-work-access";
import { createWeeklyWork, listWeeklyWork } from "@/lib/weekly-work";
import type {
  WeeklyWorkFilters,
  WeeklyWorkInput,
  WeeklyWorkType,
} from "@/lib/weekly-work-types";

function getParam(value: string | null) {
  return value ?? undefined;
}

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const filters: WeeklyWorkFilters = scopeWeeklyWorkFilters(session, {
    user_id: getParam(searchParams.get("user_id")),
    week_start: getParam(searchParams.get("week_start")),
    work_type: getParam(searchParams.get("work_type")) as WeeklyWorkType | undefined,
    search: getParam(searchParams.get("search")),
  });

  const { data, error } = await listWeeklyWork(filters);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ items: data });
}

export async function POST(request: Request) {
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
    const body = (await request.json()) as Partial<WeeklyWorkInput>;
    const { data, error } = await createWeeklyWork(session.id, {
      week_start: body.week_start ?? "",
      work_type: body.work_type ?? "project",
      project_name: body.project_name,
      content: body.content,
      daily_entries: body.daily_entries,
    });

    if (error) {
      const status = error.includes("입력") || error.includes("형식") ? 400 : 500;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "주간업무 등록 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
