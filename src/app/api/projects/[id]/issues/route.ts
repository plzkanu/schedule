import { NextResponse } from "next/server";
import {
  requireApiSession,
  requireApiWriter,
} from "@/lib/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  createProjectIssue,
  listProjectIssues,
} from "@/lib/issues";
import type { ProjectIssueInput } from "@/lib/issue-types";

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

  const { data, error } = await listProjectIssues(params.id);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ issues: data });
}

export async function POST(request: Request, { params }: RouteContext) {
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
    const { data, error } = await createProjectIssue(
      params.id,
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
      const status = error.includes("입력") ? 400 : 500;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ issue: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "이슈 등록 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
