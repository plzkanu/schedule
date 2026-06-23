import type { ItTask, TaskWithDependencies } from "@/lib/task-types";

function compareTasks(a: ItTask, b: ItTask): number {
  const orderDiff = a.sort_order - b.sort_order;
  if (orderDiff !== 0) {
    return orderDiff;
  }
  return a.created_at.localeCompare(b.created_at);
}

export function isGroupTask(
  task: Pick<ItTask, "is_group">,
  childCount = 0,
): boolean {
  return task.is_group || childCount > 0;
}

export function getChildCount(tasks: ItTask[], taskId: string): number {
  return tasks.filter((task) => task.parent_task_id === taskId).length;
}

export function sortTasksHierarchically<T extends ItTask>(tasks: T[]): T[] {
  if (tasks.length === 0) {
    return [];
  }

  const taskIds = new Set(tasks.map((task) => task.id));
  const childrenByParent = new Map<string | null, T[]>();

  for (const task of tasks) {
    const parentId =
      task.parent_task_id && taskIds.has(task.parent_task_id)
        ? task.parent_task_id
        : null;
    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(task);
    childrenByParent.set(parentId, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort(compareTasks);
  }

  const ordered: T[] = [];

  function appendSubtree(parentId: string | null) {
    const siblings = childrenByParent.get(parentId) ?? [];
    for (const task of siblings) {
      ordered.push(task);
      appendSubtree(task.id);
    }
  }

  appendSubtree(null);
  return ordered;
}

export function isDescendantOf(
  tasks: ItTask[],
  candidateId: string,
  ancestorId: string,
): boolean {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  let current: string | null = candidateId;

  while (current) {
    if (current === ancestorId) {
      return true;
    }
    current = byId.get(current)?.parent_task_id ?? null;
  }

  return false;
}

export function listGroupTaskCandidates(
  tasks: TaskWithDependencies[],
  editingTaskId?: string,
): TaskWithDependencies[] {
  return tasks.filter((task) => {
    if (task.id === editingTaskId) {
      return false;
    }
    if (editingTaskId && isDescendantOf(tasks, task.id, editingTaskId)) {
      return false;
    }
    return isGroupTask(task, getChildCount(tasks, task.id));
  });
}

export function getTaskDepth(
  tasks: ItTask[],
  taskId: string,
): number {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  let depth = 0;
  let current = byId.get(taskId)?.parent_task_id ?? null;

  while (current && byId.has(current)) {
    depth += 1;
    current = byId.get(current)?.parent_task_id ?? null;
  }

  return depth;
}
