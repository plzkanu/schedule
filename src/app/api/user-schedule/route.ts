import { NextResponse } from "next/server";
import { requireApiSession, requireApiWriter } from "@/lib/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  resolveScheduleTargetUserId,
  scopeUserScheduleFilters,
} from "@/lib/user-schedule-access";
import {
  listUserScheduleEntries,
  upsertUserScheduleEntryRange,
} from "@/lib/user-schedule";
import type {
  UserScheduleEntryInput,
  UserScheduleEntryType,
} from "@/lib/user-schedule-types";

function parseYearMonth(searchParams: URLSearchParams) {
  const now = new Date();
  const year = Number(searchParams.get("year") ?? now.getFullYear());
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return null;
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
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
  const parsed = parseYearMonth(searchParams);

  if (!parsed) {
    return NextResponse.json(
      { error: "연도·월 파라미터가 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const filters = scopeUserScheduleFilters(session, {
    year: parsed.year,
    month: parsed.month,
    user_id: searchParams.get("user_id") ?? undefined,
  });

  const { data, error } = await listUserScheduleEntries(filters);

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
    const body = (await request.json()) as Partial<UserScheduleEntryInput>;
    const targetUserId = resolveScheduleTargetUserId(session, body.user_id);

    const { data, error } = await upsertUserScheduleEntryRange(targetUserId, {
      schedule_date: body.schedule_date ?? "",
      schedule_end_date: body.schedule_end_date,
      entry_type: body.entry_type as UserScheduleEntryType,
      note: body.note,
    });

    if (error) {
      const status =
        error.includes("형식") ||
        error.includes("선택") ||
        error.includes("종료일") ||
        error.includes("시작일") ||
        error.includes("최대")
          ? 400
          : 500;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ items: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "일정 등록 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
