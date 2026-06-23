"use client";

import {
  buildTaskDeleteConfirmMessage,
  getChildTasks,
} from "@/lib/task-delete";
import type { ItTask } from "@/lib/task-types";

export type TaskDeleteResult =
  | { ok: true }
  | { ok: false; cancelled?: boolean; error?: string };

export async function deleteTaskWithConfirm(
  projectId: string,
  taskId: string,
  tasks: ItTask[],
): Promise<TaskDeleteResult> {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    return { ok: false, error: "태스크를 찾을 수 없습니다." };
  }

  const childTasks = getChildTasks(tasks, taskId);
  const confirmed = window.confirm(
    buildTaskDeleteConfirmMessage(task.name, childTasks),
  );
  if (!confirmed) {
    return { ok: false, cancelled: true };
  }

  const response = await fetch(
    `/api/projects/${projectId}/tasks/${taskId}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    return { ok: false, error: data.error ?? "태스크 삭제에 실패했습니다." };
  }

  return { ok: true };
}
