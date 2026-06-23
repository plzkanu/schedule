import Link from "next/link";
import { format } from "date-fns";
import {
  FileEdit,
  FolderPlus,
  History,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { ActivityLog } from "@/lib/activity-logs";

interface DashboardRecentActivityProps {
  logs: ActivityLog[];
  userNames: Record<string, string>;
  projectNames: Record<string, string>;
}

function formatLogTime(value: string) {
  return format(new Date(value), "MM-dd HH:mm");
}

function getActionIcon(action: string): LucideIcon {
  if (action.includes("삭제")) {
    return Trash2;
  }
  if (action.includes("생성") || action.includes("등록")) {
    return FolderPlus;
  }
  if (action.includes("수정") || action.includes("변경")) {
    return FileEdit;
  }
  return History;
}

export function DashboardRecentActivity({
  logs,
  userNames,
  projectNames,
}: DashboardRecentActivityProps) {
  return (
    <div className="surface-card h-full">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-800">최근 활동</h2>
        <p className="mt-0.5 text-xs text-slate-500">프로젝트·태스크 변경 이력</p>
      </div>
      <div className="p-5">
        {logs.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            최근 활동 이력이 없습니다.
          </p>
        ) : (
          <ol className="space-y-1">
            {logs.map((log) => {
              const Icon = getActionIcon(log.action);
              return (
                <li
                  key={log.id}
                  className="flex gap-3 rounded-lg px-2 py-3 transition hover:bg-slate-50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-navy/5">
                    <Icon className="h-4 w-4 text-brand-navy" />
                  </div>
                  <div className="min-w-0 flex-1">
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
                      {log.project_id ? (
                        <>
                          {" · "}
                          <Link
                            href={`/projects/${log.project_id}`}
                            className="text-brand-navy hover:text-brand-cyan hover:underline"
                          >
                            {projectNames[log.project_id] ?? "프로젝트"}
                          </Link>
                        </>
                      ) : null}
                    </p>
                    {log.content ? (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">
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
