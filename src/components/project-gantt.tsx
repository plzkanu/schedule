"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Task as GanttTask } from "gantt-task-react";
import { ViewMode } from "gantt-task-react";
import { CalendarDays, Maximize2 } from "lucide-react";
import { GanttLegend } from "@/components/gantt-legend";
import { GanttTaskHeader } from "@/components/gantt-task-header";
import { GanttTaskTable } from "@/components/gantt-task-table";
import { GanttTooltip } from "@/components/gantt-tooltip";
import { buildTaskMetaMaps, toGanttTasks } from "@/lib/gantt-utils";
import { deleteTaskWithConfirm } from "@/lib/task-delete-client";
import { formatTaskDate, parseTaskDate } from "@/lib/tasks";
import type { TaskWithDependencies } from "@/lib/task-types";
import { cn } from "@/lib/utils";

import "gantt-task-react/dist/index.css";

const Gantt = dynamic(
  () => import("gantt-task-react").then((mod) => mod.Gantt),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white text-sm text-slate-500">
        <CalendarDays className="mr-2 h-5 w-5 animate-pulse text-brand-cyan" />
        Gantt 차트 로딩 중...
      </div>
    ),
  },
);

const VIEW_MODES = [
  { mode: ViewMode.Day, label: "일" },
  { mode: ViewMode.Week, label: "주" },
  { mode: ViewMode.Month, label: "월" },
] as const;

const ROW_HEIGHT = 46;
const HEADER_HEIGHT = 56;

interface ProjectGanttProps {
  projectId: string;
  tasks: TaskWithDependencies[];
  canWrite: boolean;
  onTasksChange: () => Promise<void>;
  onEditTask: (taskId: string) => void;
  highlightTaskId?: string;
  assigneeNames?: Record<string, string>;
}

function formatDateRange(tasks: TaskWithDependencies[]) {
  if (tasks.length === 0) {
    return null;
  }

  const starts = tasks.map((t) => t.start_date).sort();
  const ends = tasks.map((t) => t.end_date).sort();
  return `${starts[0]} ~ ${ends[ends.length - 1]}`;
}

export function ProjectGantt({
  projectId,
  tasks,
  canWrite,
  onTasksChange,
  onEditTask,
  highlightTaskId,
  assigneeNames = {},
}: ProjectGanttProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
  const [error, setError] = useState("");
  const [viewDate, setViewDate] = useState<Date>(() => new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string>();

  const { statusByTaskId, isGroupByTaskId } = useMemo(
    () => buildTaskMetaMaps(tasks),
    [tasks],
  );

  const ganttTasks = useMemo(
    () => toGanttTasks(tasks, !canWrite, highlightTaskId),
    [tasks, canWrite, highlightTaskId],
  );

  const ganttHeight = useMemo(
    () => Math.min(Math.max(ganttTasks.length * ROW_HEIGHT + 24, 260), 480),
    [ganttTasks.length],
  );

  const dateRange = useMemo(() => formatDateRange(tasks), [tasks]);
  const avgProgress = useMemo(() => {
    if (tasks.length === 0) {
      return 0;
    }
    return Math.round(
      tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length,
    );
  }, [tasks]);

  useEffect(() => {
    if (!highlightTaskId) {
      return;
    }

    const task = tasks.find((item) => item.id === highlightTaskId);
    if (task) {
      setViewDate(parseTaskDate(task.start_date));
      setViewMode(ViewMode.Week);
    }
  }, [highlightTaskId, tasks]);

  const TooltipContent = useCallback(
    ({
      task,
      fontSize,
      fontFamily,
    }: {
      task: GanttTask;
      fontSize: string;
      fontFamily: string;
    }) => {
      const source = tasks.find((item) => item.id === task.id);
      return (
        <GanttTooltip
          task={task}
          fontSize={fontSize}
          fontFamily={fontFamily}
          status={statusByTaskId[task.id]}
          assigneeName={
            source?.assignee_id
              ? assigneeNames[source.assignee_id]
              : undefined
          }
          notes={source?.notes}
        />
      );
    },
    [statusByTaskId, tasks, assigneeNames],
  );

  async function deleteTaskById(taskId: string) {
    if (!canWrite) {
      return;
    }

    const result = await deleteTaskWithConfirm(projectId, taskId, tasks);
    if (result.ok) {
      setError("");
      await onTasksChange();
      return;
    }

    if (result.error) {
      setError(result.error);
    }
  }

  async function handleDelete(task: GanttTask) {
    if (!canWrite) {
      return false;
    }

    const result = await deleteTaskWithConfirm(projectId, task.id, tasks);
    if (result.ok) {
      setError("");
      await onTasksChange();
      return true;
    }

    if (result.error) {
      setError(result.error);
    }

    return false;
  }

  const TaskListTable = useCallback(
    (props: {
      rowHeight: number;
      rowWidth: string;
      fontFamily: string;
      fontSize: string;
      locale: string;
      tasks: GanttTask[];
      selectedTaskId: string;
      setSelectedTask: (taskId: string) => void;
      onExpanderClick: (task: GanttTask) => void;
    }) => (
      <GanttTaskTable
        {...props}
        statusByTaskId={statusByTaskId}
        isGroupByTaskId={isGroupByTaskId}
        highlightTaskId={highlightTaskId}
        canWrite={canWrite}
        onEditTask={onEditTask}
        onDeleteTask={deleteTaskById}
      />
    ),
    [statusByTaskId, isGroupByTaskId, highlightTaskId, canWrite, onEditTask, tasks],
  );

  function handleGanttKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!canWrite || !selectedTaskId || event.key !== "Delete") {
      return;
    }

    event.preventDefault();
    void deleteTaskById(selectedTaskId);
  }

  async function patchTask(
    taskId: string,
    body: Record<string, unknown>,
  ): Promise<boolean> {
    const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "태스크 변경에 실패했습니다.");
      return false;
    }

    setError("");
    await onTasksChange();
    return true;
  }

  async function handleDateChange(task: GanttTask) {
    if (!canWrite) {
      return false;
    }

    return patchTask(task.id, {
      start_date: formatTaskDate(task.start),
      end_date: formatTaskDate(task.end),
    });
  }

  async function handleProgressChange(task: GanttTask) {
    if (!canWrite) {
      return false;
    }

    return patchTask(task.id, {
      progress: Math.round(task.progress),
    });
  }

  function scrollToToday() {
    setViewDate(new Date());
  }

  const columnWidth =
    viewMode === ViewMode.Month ? 72 : viewMode === ViewMode.Week ? 56 : 44;

  return (
    <div className="space-y-4">
      {tasks.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-4 py-3">
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span>
              <strong className="font-semibold text-brand-navy">{tasks.length}</strong>
              {" "}개 태스크
            </span>
            {dateRange ? (
              <span className="hidden sm:inline text-slate-400">·</span>
            ) : null}
            {dateRange ? (
              <span className="hidden sm:inline">{dateRange}</span>
            ) : null}
            <span className="text-slate-400">·</span>
            <span>
              평균 진행률{" "}
              <strong className="font-semibold text-brand-cyan">{avgProgress}%</strong>
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 shadow-sm">
            {VIEW_MODES.map(({ mode, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => setViewMode(mode)}
                className={cn(
                  "rounded-md px-3.5 py-1.5 text-xs font-medium transition-all",
                  viewMode === mode
                    ? "bg-white text-brand-navy shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={scrollToToday}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-brand-cyan/40 hover:text-brand-navy"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            오늘
          </button>
        </div>
        <p className="text-xs text-slate-400">
          {canWrite
            ? "태스크명 더블클릭 수정 · 우클릭 삭제 · Delete 키 삭제 · 드래그로 일정 조정"
            : "조회 전용"}
        </p>
      </div>

      <GanttLegend />

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100">
          {error}
        </p>
      ) : null}

      {ganttTasks.length === 0 ? (
        <div className="flex h-52 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50/80 to-white text-sm text-slate-500">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <CalendarDays className="h-7 w-7 text-slate-300" />
          </div>
          <div className="text-center">
            <p className="font-medium text-slate-600">등록된 태스크가 없습니다</p>
            {canWrite ? (
              <p className="mt-1 text-xs text-slate-400">
                태스크를 추가하면 Gantt 차트에 일정이 표시됩니다
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div
          className="gantt-wrapper overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40"
          tabIndex={canWrite ? 0 : -1}
          onKeyDown={handleGanttKeyDown}
        >
          <Gantt
            tasks={ganttTasks}
            viewMode={viewMode}
            viewDate={viewDate}
            preStepsCount={2}
            locale="ko-KR"
            listCellWidth="240px"
            columnWidth={columnWidth}
            rowHeight={ROW_HEIGHT}
            headerHeight={HEADER_HEIGHT}
            ganttHeight={ganttHeight}
            barFill={55}
            barCornerRadius={6}
            handleWidth={8}
            fontSize="13px"
            todayColor="rgba(0, 154, 218, 0.06)"
            arrowColor="#94a3b8"
            TooltipContent={TooltipContent}
            TaskListHeader={GanttTaskHeader}
            TaskListTable={TaskListTable}
            onSelect={(task, isSelected) => {
              setSelectedTaskId(isSelected ? task.id : undefined);
            }}
            onDateChange={canWrite ? handleDateChange : undefined}
            onProgressChange={canWrite ? handleProgressChange : undefined}
            onDoubleClick={canWrite ? (task) => onEditTask(task.id) : undefined}
            onClick={
              canWrite
                ? (task) => {
                    setSelectedTaskId(task.id);
                  }
                : undefined
            }
            onDelete={canWrite ? handleDelete : undefined}
          />
        </div>
      )}
    </div>
  );
}
