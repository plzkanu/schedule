import { NextResponse } from "next/server";
import {
  requireApiSession,
  requireApiWriter,
} from "@/lib/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createProjectTask, listProjectTasks } from "@/lib/tasks";
import type { TaskInput } from "@/lib/task-types";

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

  const { data, error } = await listProjectTasks(params.id);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ tasks: data });
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
    const body = (await request.json()) as Partial<TaskInput>;
    const { data, error } = await createProjectTask(
      params.id,
      {
        name: body.name ?? "",
        notes: body.notes,
        assignee_id: body.assignee_id,
        start_date: body.start_date ?? "",
        end_date: body.end_date ?? "",
        status: body.status ?? "계획",
        progress: body.progress ?? 0,
        is_group: body.is_group,
        parent_task_id: body.parent_task_id,
        dependency_ids: body.dependency_ids,
        sort_order: body.sort_order,
      },
      session.id,
    );

    if (error) {
      const status =
        error.includes("입력") ||
        error.includes("그룹") ||
        error.includes("상위") ||
        error.includes("하위")
          ? 400
          : 500;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ task: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "태스크 등록 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
