"use client";

import { format } from "date-fns";
import {
  AlertCircle,
  FileEdit,
  FolderPlus,
  History,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { ActivityLog } from "@/lib/activity-logs";

interface ActivityTimelineProps {
  logs: ActivityLog[];
  userNames: Record<string, string>;
}

function formatLogTime(value: string) {
  return format(new Date(value), "MM-dd HH:mm");
}

function getActionIcon(action: string): LucideIcon {
  if (action.includes("삭제")) {
    return Trash2;
  }
  if (action.includes("이슈")) {
    return AlertCircle;
  }
  if (action.includes("생성") || action.includes("등록")) {
    return FolderPlus;
  }
  if (action.includes("수정") || action.includes("변경")) {
    return FileEdit;
  }
  return History;
}

export function ActivityTimeline({ logs, userNames }: ActivityTimelineProps) {
  return (
    <div className="surface-card h-full">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-800">활동 이력</h2>
        <p className="mt-0.5 text-xs text-slate-500">프로젝트 변경 타임라인</p>
      </div>
      <div className="max-h-[520px] overflow-y-auto p-5">
        {logs.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500">활동 이력이 없습니다.</p>
            <p className="mt-1 text-xs text-slate-400">
              프로젝트·태스크 변경 시 자동 기록됩니다.
            </p>
          </div>
        ) : (
          <ol className="relative space-y-0">
            <div
              aria-hidden
              className="absolute bottom-2 left-4 top-2 w-px bg-slate-200"
            />
            {logs.map((log) => {
              const Icon = getActionIcon(log.action);
              return (
                <li key={log.id} className="relative flex gap-3 pb-6 last:pb-0">
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-navy/5 ring-4 ring-white">
                    <Icon className="h-4 w-4 text-brand-navy" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">
                        {log.action}
                      </p>
                      <time className="shrink-0 text-xs text-slate-400">
                        {formatLogTime(log.created_at)}
                      </time>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {log.user_id
                        ? (userNames[log.user_id] ?? log.user_id)
                        : "시스템"}
                    </p>
                    {log.content ? (
                      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        {log.content}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
