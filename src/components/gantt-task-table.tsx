"use client";

import { useEffect, useState } from "react";
import type { Task } from "gantt-task-react";
import type { TaskStatus } from "@/lib/task-types";
import { GANTT_STATUS_STYLES } from "@/lib/task-types";
import { cn } from "@/lib/utils";

interface TaskContextMenuState {
  x: number;
  y: number;
  taskId: string;
  taskName: string;
}

interface GanttTaskTableProps {
  rowHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
  locale: string;
  tasks: Task[];
  selectedTaskId: string;
  setSelectedTask: (taskId: string) => void;
  onExpanderClick: (task: Task) => void;
  statusByTaskId: Record<string, TaskStatus>;
  isGroupByTaskId: Record<string, boolean>;
  highlightTaskId?: string;
  canWrite?: boolean;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function GanttTaskTable({
  rowHeight,
  rowWidth,
  fontFamily,
  fontSize,
  tasks,
  selectedTaskId,
  setSelectedTask,
  onExpanderClick,
  statusByTaskId,
  isGroupByTaskId,
  highlightTaskId,
  canWrite = false,
  onEditTask,
  onDeleteTask,
}: GanttTaskTableProps) {
  const [contextMenu, setContextMenu] = useState<TaskContextMenuState | null>(
    null,
  );

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

  function handleEdit(taskId: string) {
    setContextMenu(null);
    onEditTask?.(taskId);
  }

  function handleDelete(taskId: string) {
    setContextMenu(null);
    onDeleteTask?.(taskId);
  }

  return (
    <>
      <div
        className="gantt-task-list border-r border-slate-200 bg-white"
        style={{ fontFamily, fontSize, width: rowWidth }}
      >
        {tasks.map((task) => {
          const status = statusByTaskId[task.id];
          const statusColor = status
            ? GANTT_STATUS_STYLES[status].backgroundColor
            : "#cbd5e1";
          const isSelected = selectedTaskId === task.id;
          const isHighlighted = highlightTaskId === task.id;
          const hasChildren = tasks.some((item) => item.project === task.id);
          const isGroup = isGroupByTaskId[task.id] ?? hasChildren;
          const indent = isGroup ? 0 : task.project ? 20 : 8;

          return (
            <div
              key={task.id}
              className={cn(
                "flex cursor-pointer items-center border-b border-slate-100 px-3 transition-colors",
                isSelected && "bg-brand-cyan/10",
                isHighlighted &&
                  "border-l-2 border-l-brand-cyan bg-brand-cyan/10",
                !isSelected && !isHighlighted && "hover:bg-white/80",
              )}
              style={{ height: rowHeight }}
              onClick={() => setSelectedTask(task.id)}
              onDoubleClick={(event) => {
                event.preventDefault();
                if (canWrite) {
                  handleEdit(task.id);
                }
              }}
              onContextMenu={(event) => {
                if (!canWrite) {
                  return;
                }
                event.preventDefault();
                setContextMenu({
                  x: event.clientX,
                  y: event.clientY,
                  taskId: task.id,
                  taskName: task.name,
                });
              }}
            >
              {isGroup ? (
                <button
                  type="button"
                  className="mr-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                  onClick={(event) => {
                    event.stopPropagation();
                    onExpanderClick(task);
                  }}
                  onDoubleClick={(event) => event.stopPropagation()}
                >
                  {task.hideChildren ? "▸" : "▾"}
                </button>
              ) : (
                <span className="mr-1 w-5 shrink-0" />
              )}
              <span
                className="mr-2 h-2 w-2 shrink-0 rounded-full ring-2 ring-white"
                style={{ backgroundColor: statusColor, marginLeft: indent }}
              />
              <span
                className={cn(
                  "truncate text-sm",
                  isGroup ? "font-semibold text-slate-800" : "text-slate-700",
                  isHighlighted && "font-medium text-brand-navy",
                )}
              >
                {task.name}
              </span>
              {status ? (
                <span className="ml-auto shrink-0 pl-2 text-[10px] font-medium text-slate-400">
                  {Math.round(task.progress)}%
                </span>
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
            onClick={() => handleEdit(contextMenu.taskId)}
          >
            수정
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            onClick={() => handleDelete(contextMenu.taskId)}
          >
            삭제
          </button>
        </div>
      ) : null}
    </>
  );
}
