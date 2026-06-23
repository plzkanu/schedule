"use client";

import { differenceInCalendarDays, format } from "date-fns";
import { ko } from "date-fns/locale";
import type { Task } from "gantt-task-react";
import type { TaskStatus } from "@/lib/task-types";
import { GANTT_STATUS_STYLES } from "@/lib/task-types";

interface GanttTooltipProps {
  task: Task;
  fontSize: string;
  fontFamily: string;
  status?: TaskStatus;
  assigneeName?: string;
  notes?: string | null;
}

export function GanttTooltip({
  task,
  fontSize,
  fontFamily,
  status,
  assigneeName,
  notes,
}: GanttTooltipProps) {
  const duration =
    differenceInCalendarDays(task.end, task.start) + 1;
  const statusColor = status
    ? GANTT_STATUS_STYLES[status].backgroundColor
    : task.styles?.backgroundColor;

  return (
    <div
      className="gantt-tooltip min-w-[220px] rounded-xl border border-slate-200/80 bg-white p-3 shadow-lg ring-1 ring-black/5"
      style={{ fontSize, fontFamily }}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white"
          style={{ backgroundColor: statusColor }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{task.name}</p>
          {status ? (
            <p className="mt-0.5 text-xs text-slate-500">{status}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">기간</span>
          <span className="font-medium text-slate-700">
            {format(task.start, "M/d", { locale: ko })} –{" "}
            {format(task.end, "M/d", { locale: ko })}
            <span className="ml-1 text-slate-400">({duration}일)</span>
          </span>
        </div>
        {assigneeName ? (
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">담당</span>
            <span className="font-medium text-slate-700">{assigneeName}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">진행률</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-cyan transition-all"
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <span className="font-semibold tabular-nums text-brand-navy">
              {Math.round(task.progress)}%
            </span>
          </div>
        </div>
        {notes ? (
          <div className="border-t border-slate-100 pt-2">
            <p className="text-slate-400">비고</p>
            <p className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed text-slate-700">
              {notes}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
