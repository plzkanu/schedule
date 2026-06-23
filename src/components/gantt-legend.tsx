"use client";

import { PROJECT_STATUSES } from "@/lib/project-types";
import { GANTT_STATUS_STYLES } from "@/lib/task-types";

export function GanttLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {PROJECT_STATUSES.map((status) => (
        <div key={status} className="flex items-center gap-1.5 text-xs text-slate-600">
          <span
            className="h-2.5 w-2.5 rounded-full ring-1 ring-black/5"
            style={{ backgroundColor: GANTT_STATUS_STYLES[status].backgroundColor }}
          />
          <span>{status}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 text-xs text-slate-600">
        <span className="h-2.5 w-6 rounded-sm bg-brand-cyan/15 ring-1 ring-brand-cyan/30" />
        <span>오늘</span>
      </div>
    </div>
  );
}
