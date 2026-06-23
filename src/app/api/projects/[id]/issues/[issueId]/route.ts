import { NextResponse } from "next/server";
import {
  requireApiSession,
  requireApiWriter,
} from "@/lib/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  deleteProjectIssue,
  updateProjectIssue,
} from "@/lib/issues";
import type { ProjectIssueInput } from "@/lib/issue-types";

interface RouteContext {
  params: { id: string; issueId: string };
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

  try {
    const body = (await request.json()) as Partial<ProjectIssueInput>;
    const { data, error } = await updateProjectIssue(
      params.id,
      params.issueId,
      {
        title: body.title ?? "",
        description: body.description,
        severity: body.severity ?? "중",
        status: body.status ?? "신규",
        reporter_id: body.reporter_id,
        assignee_id: body.assignee_id,
        occurred_date: body.occurred_date ?? "",
        resolution: body.resolution,
        notes: body.notes,
      },
      session.id,
    );

    if (error) {
      const status =
        error.includes("입력") || error.includes("찾을 수 없") ? 400 : 500;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ issue: data });
  } catch {
    return NextResponse.json(
      { error: "이슈 수정 처리 중 오류가 발생했습니다." },
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

  const { error } = await deleteProjectIssue(
    params.id,
    params.issueId,
    session.id,
  );

  if (error) {
    const status = error.includes("찾을 수 없") ? 404 : 500;
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ ok: true });
}
