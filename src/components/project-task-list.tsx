"use client";

import { format } from "date-fns";
import { ChevronRight, FolderKanban, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ProgressBar } from "@/components/progress-bar";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { deleteTaskWithConfirm } from "@/lib/task-delete-client";
import { getChildCount, getTaskDepth, isGroupTask, sortTasksHierarchically } from "@/lib/task-hierarchy";
import type { TaskWithDependencies } from "@/lib/task-types";
import type { UserPublic } from "@/lib/types";
import { buildUserDisplayMap } from "@/lib/user-display";
import { cn } from "@/lib/utils";

interface ProjectTaskListProps {
  projectId: string;
  tasks: TaskWithDependencies[];
  assignees: UserPublic[];
  canWrite: boolean;
  onEditTask: (taskId: string) => void;
  onTasksChange: () => Promise<void>;
}

interface TaskContextMenuState {
  x: number;
  y: number;
  taskId: string;
}

function formatDateLabel(value: string) {
  return format(new Date(`${value}T00:00:00`), "MM-dd");
}

export function ProjectTaskList({
  projectId,
  tasks,
  assignees,
  canWrite,
  onEditTask,
  onTasksChange,
}: ProjectTaskListProps) {
  const [contextMenu, setContextMenu] = useState<TaskContextMenuState | null>(
    null,
  );
  const [deletingTaskId, setDeletingTaskId] = useState<string>();
  const [error, setError] = useState("");

  const assigneeMap = buildUserDisplayMap(assignees);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    function closeMenu() {
      setContextMenu(null);
    }

    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [contextMenu]);

  async function handleDelete(taskId: string) {
    setContextMenu(null);
    setError("");
    setDeletingTaskId(taskId);

    try {
      const result = await deleteTaskWithConfirm(projectId, taskId, tasks);
      if (result.ok) {
        await onTasksChange();
        return;
      }

      if (result.error) {
        setError(result.error);
      }
    } finally {
      setDeletingTaskId(undefined);
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
        <p className="text-sm font-medium text-slate-600">
          등록된 태스크가 없습니다
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Gantt 차트 또는 태스크 추가로 일정을 구성하세요.
        </p>
      </div>
    );
  }

  const sorted = sortTasksHierarchically(tasks);

  return (
    <>
      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        {sorted.map((task) => {
          const depth = getTaskDepth(tasks, task.id);
          const childCount = getChildCount(tasks, task.id);
          const groupTask = isGroupTask(task, childCount);
          const isDeleting = deletingTaskId === task.id;

          return (
            <div
              key={task.id}
              className={cn(
                "group relative flex w-full items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 text-left transition",
                canWrite && "hover:border-brand-cyan/30 hover:shadow-sm",
                depth > 0 && "border-l-2 border-l-brand-cyan/30",
                isDeleting && "opacity-60",
              )}
              style={{ marginLeft: depth * 16 }}
              onContextMenu={(event) => {
                if (!canWrite) {
                  return;
                }
                event.preventDefault();
                setContextMenu({
                  x: event.clientX,
                  y: event.clientY,
                  taskId: task.id,
                });
              }}
            >
              <button
                type="button"
                disabled={!canWrite || isDeleting}
                onClick={() => canWrite && onEditTask(task.id)}
                className={cn(
                  "min-w-0 flex-1 text-left",
                  !canWrite && "cursor-default",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{task.name}</span>
                  {groupTask ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-brand-navy">
                      <FolderKanban className="h-3 w-3" />
                      그룹
                    </span>
                  ) : null}
                  <ProjectStatusBadge status={task.status} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDateLabel(task.start_date)} ~{" "}
                  {formatDateLabel(task.end_date)}
                  {task.assignee_id
                    ? ` · ${assigneeMap[task.assignee_id] ?? "담당자 미지정"}`
                    : ""}
                  {childCount > 0 ? ` · 하위 ${childCount}개` : ""}
                </p>
                <ProgressBar
                  value={task.progress}
                  showLabel
                  className="mt-2 max-w-xs"
                />
                {task.notes ? (
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {task.notes}
                  </p>
                ) : null}
              </button>

              {canWrite ? (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void handleDelete(task.id)}
                    disabled={isDeleting}
                    className="rounded-lg p-2 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    title="태스크 삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {contextMenu ? (
        <div
          className="fixed z-50 min-w-[120px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setContextMenu(null);
              onEditTask(contextMenu.taskId);
            }}
          >
            수정
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            onClick={() => void handleDelete(contextMenu.taskId)}
          >
            삭제
          </button>
        </div>
      ) : null}
    </>
  );
}
