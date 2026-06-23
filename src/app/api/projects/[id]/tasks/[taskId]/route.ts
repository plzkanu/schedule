import { NextResponse } from "next/server";
import {
  requireApiSession,
  requireApiWriter,
} from "@/lib/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  deleteProjectTask,
  getProjectTask,
  updateProjectTask,
  updateProjectTaskProgress,
  updateProjectTaskSchedule,
} from "@/lib/tasks";
import type { TaskInput } from "@/lib/task-types";

interface RouteContext {
  params: { id: string; taskId: string };
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

  const { data, error } = await getProjectTask(params.id, params.taskId);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "태스크를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({ task: data });
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
    const body = (await request.json()) as Partial<TaskInput> & {
      start_date?: string;
      end_date?: string;
      progress?: number;
    };

    const keys = Object.keys(body);

    if (
      keys.length === 2 &&
      body.start_date !== undefined &&
      body.end_date !== undefined
    ) {
      const { error } = await updateProjectTaskSchedule(
        params.id,
        params.taskId,
        body.start_date,
        body.end_date,
        session.id,
      );

      if (error) {
        const status = error.includes("찾을") ? 404 : 400;
        return NextResponse.json({ error }, { status });
      }

      return NextResponse.json({ ok: true });
    }

    if (keys.length === 1 && body.progress !== undefined) {
      const { error } = await updateProjectTaskProgress(
        params.id,
        params.taskId,
        body.progress,
        session.id,
      );

      if (error) {
        const status = error.includes("찾을") ? 404 : 400;
        return NextResponse.json({ error }, { status });
      }

      return NextResponse.json({ ok: true });
    }

    const { data, error } = await updateProjectTask(
      params.id,
      params.taskId,
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
      const status = error.includes("찾을")
        ? 404
        : error.includes("입력") ||
            error.includes("그룹") ||
            error.includes("상위") ||
            error.includes("하위")
          ? 400
          : 500;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ task: data });
  } catch {
    return NextResponse.json(
      { error: "태스크 수정 처리 중 오류가 발생했습니다." },
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

  const { error } = await deleteProjectTask(
    params.id,
    params.taskId,
    session.id,
  );

  if (error) {
    const status = error.includes("찾을") ? 404 : 500;
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ ok: true });
}
