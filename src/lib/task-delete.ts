import type { ItTask } from "@/lib/task-types";

export function getChildTasks<T extends ItTask>(
  tasks: T[],
  parentTaskId: string,
): T[] {
  return tasks.filter((task) => task.parent_task_id === parentTaskId);
}

export function buildTaskDeleteConfirmMessage(
  taskName: string,
  childTasks: Pick<ItTask, "name">[],
): string {
  if (childTasks.length === 0) {
    return `"${taskName}" 태스크를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`;
  }

  const childPreview = childTasks
    .slice(0, 5)
    .map((child) => `· ${child.name}`)
    .join("\n");
  const moreCount =
    childTasks.length > 5 ? `\n· 외 ${childTasks.length - 5}개` : "";

  return [
    `"${taskName}" 상위 태스크를 삭제하시겠습니까?`,
    "",
    `하위 태스크 ${childTasks.length}개도 함께 삭제됩니다.`,
    childPreview + moreCount,
    "",
    "이 작업은 되돌릴 수 없습니다.",
  ].join("\n");
}
