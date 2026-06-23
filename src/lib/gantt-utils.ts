import type { Task } from "gantt-task-react";
import { sortTasksHierarchically } from "@/lib/task-hierarchy";
import {
  GANTT_STATUS_STYLES,
  type TaskWithDependencies,
} from "@/lib/task-types";
import { parseTaskDate } from "@/lib/tasks";

export function toGanttTasks(
  tasks: TaskWithDependencies[],
  readOnly: boolean,
  highlightTaskId?: string,
): Task[] {
  const orderedTasks = sortTasksHierarchically(tasks);

  return orderedTasks.map((task) => {
    const styles = GANTT_STATUS_STYLES[task.status];
    const isHighlighted = task.id === highlightTaskId;

    return {
      id: task.id,
      type: "task" as const,
      name: task.name,
      start: parseTaskDate(task.start_date),
      end: parseTaskDate(task.end_date),
      progress: task.progress,
      project: task.parent_task_id ?? undefined,
      dependencies: task.dependency_ids,
      isDisabled: readOnly,
      styles: {
        backgroundColor: isHighlighted ? "#bae6fd" : styles.backgroundColor,
        backgroundSelectedColor: isHighlighted ? "#7dd3fc" : styles.backgroundColor,
        progressColor: styles.progressColor,
        progressSelectedColor: styles.progressColor,
      },
      displayOrder: task.sort_order,
    };
  });
}

export function buildTaskMetaMaps(tasks: TaskWithDependencies[]) {
  const statusByTaskId: Record<string, TaskWithDependencies["status"]> = {};
  const assigneeByTaskId: Record<string, string | undefined> = {};
  const isGroupByTaskId: Record<string, boolean> = {};

  for (const task of tasks) {
    statusByTaskId[task.id] = task.status;
    assigneeByTaskId[task.id] = task.assignee_id ?? undefined;
    isGroupByTaskId[task.id] =
      task.is_group ||
      tasks.some((item) => item.parent_task_id === task.id);
  }

  return { statusByTaskId, assigneeByTaskId, isGroupByTaskId };
}
