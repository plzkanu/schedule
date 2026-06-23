import { NextResponse } from "next/server";
import {
  requireApiSession,
  requireApiWriter,
} from "@/lib/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { deleteProject, getProject, updateProject } from "@/lib/projects";
import type { ProjectInput } from "@/lib/project-types";

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

  const { data, error } = await getProject(params.id);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "프로젝트를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({ project: data });
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
    const body = (await request.json()) as Partial<ProjectInput>;
    const { data, error } = await updateProject(
      params.id,
      {
        name: body.name ?? "",
        description: body.description,
        status: body.status ?? "계획",
        priority: body.priority ?? "중",
        start_date: body.start_date ?? "",
        end_date: body.end_date ?? "",
        progress: body.progress ?? 0,
        owner_id: body.owner_id,
        department: body.department,
      },
      session.id,
    );

    if (error) {
      const status = error.includes("찾을") ? 404 : error.includes("입력") ? 400 : 500;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ project: data });
  } catch {
    return NextResponse.json(
      { error: "프로젝트 수정 처리 중 오류가 발생했습니다." },
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

  const { error } = await deleteProject(params.id, session.id);

  if (error) {
    const status = error.includes("찾을") ? 404 : 500;
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ ok: true });
}
