import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { WeeklyWorkResponseStatus } from "@/lib/weekly-work-comment-types";
import {
  canCommentWeeklyWork,
  canReplyWeeklyWork,
  canViewWeeklyWork,
} from "@/lib/weekly-work-access";
import {
  createWeeklyWorkAdminComment,
  createWeeklyWorkUserResponse,
  listWeeklyWorkComments,
  markWeeklyWorkCommentsRead,
} from "@/lib/weekly-work-comments";
import { getWeeklyWork } from "@/lib/weekly-work";

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

  const existing = await getWeeklyWork(params.id);
  if (existing.error) {
    return NextResponse.json({ error: existing.error }, { status: 500 });
  }
  if (!existing.data) {
    return NextResponse.json({ error: "주간업무를 찾을 수 없습니다." }, { status: 404 });
  }
  if (!canViewWeeklyWork(session, existing.data)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  if (
    existing.data.user_id === session.id ||
    (session.role === "admin" && existing.data.user_id !== session.id)
  ) {
    await markWeeklyWorkCommentsRead(params.id, session.id);
  }

  const { data, error } = await listWeeklyWorkComments(params.id);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ comments: data });
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

  const existing = await getWeeklyWork(params.id);
  if (existing.error) {
    return NextResponse.json({ error: existing.error }, { status: 500 });
  }
  if (!existing.data) {
    return NextResponse.json({ error: "주간업무를 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      content?: string;
      status?: WeeklyWorkResponseStatus;
      parent_id?: string | null;
    };

    const parentId = body.parent_id?.trim() || null;
    const isOwner = canReplyWeeklyWork(session, existing.data);
    const isAdminCommenter = canCommentWeeklyWork(session, existing.data);

    if (parentId) {
      if (isOwner) {
        const { data, error } = await createWeeklyWorkUserResponse(
          params.id,
          session.id,
          body.status as WeeklyWorkResponseStatus,
          body.content ?? "",
          parentId,
        );

        if (error) {
          const status =
            error.includes("선택") ||
            error.includes("입력") ||
            error.includes("찾을 수 없")
              ? 400
              : 500;
          return NextResponse.json({ error }, { status });
        }

        return NextResponse.json({ comment: data }, { status: 201 });
      }

      if (isAdminCommenter) {
        const { data, error } = await createWeeklyWorkAdminComment(
          params.id,
          session.id,
          body.content ?? "",
          parentId,
        );

        if (error) {
          const status =
            error.includes("입력") || error.includes("찾을 수 없") ? 400 : 500;
          return NextResponse.json({ error }, { status });
        }

        return NextResponse.json({ comment: data }, { status: 201 });
      }

      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (!isAdminCommenter) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { data, error } = await createWeeklyWorkAdminComment(
      params.id,
      session.id,
      body.content ?? "",
      null,
    );

    if (error) {
      const status = error.includes("입력") ? 400 : 500;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "코멘트 등록 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
