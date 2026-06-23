import { NextResponse } from "next/server";
import {
  requireApiSession,
  requireApiWriter,
} from "@/lib/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createProject, listProjects } from "@/lib/projects";
import type {
  ProjectFilters,
  ProjectInput,
  ProjectPriority,
  ProjectStatus,
} from "@/lib/project-types";

function parseFilters(searchParams: URLSearchParams): ProjectFilters {
  const filters: ProjectFilters = {};

  const status = searchParams.get("status");
  if (status) {
    filters.status = status as ProjectStatus;
  }

  const priority = searchParams.get("priority");
  if (priority) {
    filters.priority = priority as ProjectPriority;
  }

  const ownerId = searchParams.get("owner_id");
  if (ownerId) {
    filters.owner_id = ownerId;
  }

  const progressMin = searchParams.get("progress_min");
  if (progressMin !== null && progressMin !== "") {
    filters.progress_min = Number(progressMin);
  }

  const progressMax = searchParams.get("progress_max");
  if (progressMax !== null && progressMax !== "") {
    filters.progress_max = Number(progressMax);
  }

  return filters;
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
  const { data, error } = await listProjects(parseFilters(searchParams));

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ projects: data });
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
    const body = (await request.json()) as Partial<ProjectInput>;
    const { data, error } = await createProject(
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
      const status = error.includes("입력") ? 400 : 500;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ project: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "프로젝트 등록 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
