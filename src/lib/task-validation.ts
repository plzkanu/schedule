import { PROJECT_STATUSES } from "./project-types";
import {
  getChildCount,
  isDescendantOf,
  isGroupTask,
} from "./task-hierarchy";
import type { ItTask, TaskInput, TaskStatus } from "./task-types";

export function validateTaskInput(input: Partial<TaskInput>): string | null {
  const name = input.name?.trim();
  if (!name) {
    return "태스크명을 입력해 주세요.";
  }

  if (!input.start_date || !input.end_date) {
    return "시작일과 종료일을 입력해 주세요.";
  }

  if (input.start_date > input.end_date) {
    return "종료일은 시작일 이후여야 합니다.";
  }

  if (input.status && !PROJECT_STATUSES.includes(input.status as TaskStatus)) {
    return "올바른 상태값이 아닙니다.";
  }

  if (
    input.progress !== undefined &&
    (input.progress < 0 || input.progress > 100)
  ) {
    return "진행률은 0~100 사이여야 합니다.";
  }

  if (input.notes !== undefined && input.notes !== null) {
    const notes = input.notes.trim();
    if (notes.length > 2000) {
      return "비고는 2,000자 이내로 입력해 주세요.";
    }
  }

  return null;
}

export function validateTaskHierarchy(
  input: Partial<TaskInput>,
  existingTasks: ItTask[],
  taskId?: string,
): string | null {
  const isGroup = Boolean(input.is_group);
  const parentTaskId = input.parent_task_id?.trim() || null;

  if (isGroup && parentTaskId) {
    return "상위 태스크(그룹)는 다른 그룹의 하위 태스크가 될 수 없습니다.";
  }

  if (taskId && !isGroup) {
    const childCount = getChildCount(existingTasks, taskId);
    if (childCount > 0) {
      return "하위 태스크가 있는 그룹은 상위 태스크 설정을 해제할 수 없습니다.";
    }
  }

  if (parentTaskId) {
    if (taskId && parentTaskId === taskId) {
      return "자기 자신을 상위 태스크로 지정할 수 없습니다.";
    }

    if (taskId && isDescendantOf(existingTasks, parentTaskId, taskId)) {
      return "하위 태스크를 상위 태스크로 지정할 수 없습니다.";
    }

    const parent = existingTasks.find((task) => task.id === parentTaskId);
    if (!parent) {
      return "상위 태스크를 찾을 수 없습니다.";
    }

    if (!isGroupTask(parent, getChildCount(existingTasks, parent.id))) {
      return "상위 태스크는 그룹으로 지정된 태스크만 선택할 수 있습니다.";
    }
  }

  return null;
}

export function normalizeTaskInput(input: TaskInput) {
  const isGroup = Boolean(input.is_group);

  return {
    name: input.name.trim(),
    notes: input.notes?.trim() || null,
    assignee_id: input.assignee_id?.trim() || null,
    start_date: input.start_date,
    end_date: input.end_date,
    status: input.status,
    progress: input.progress,
    is_group: isGroup,
    parent_task_id: isGroup ? null : input.parent_task_id?.trim() || null,
    sort_order: input.sort_order ?? 0,
    dependency_ids: input.dependency_ids ?? [],
  };
}

export function validateTaskDependencies(
  taskId: string | undefined,
  dependencyIds: string[],
): string | null {
  if (taskId && dependencyIds.includes(taskId)) {
    return "태스크는 자기 자신을 의존 대상으로 지정할 수 없습니다.";
  }
  return null;
}

function normalizeTaskRecord(task: ItTask): ItTask {
  return {
    ...task,
    is_group: task.is_group ?? false,
    notes: task.notes ?? null,
  };
}

export function normalizeTaskRecords(tasks: ItTask[]): ItTask[] {
  return tasks.map(normalizeTaskRecord);
}
