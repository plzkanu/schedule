import Link from "next/link";
import { ActivityLogList } from "@/components/activity-log-list";
import type { ActivityLog } from "@/lib/activity-logs";

interface DashboardRecentActivityProps {
  logs: ActivityLog[];
  userNames: Record<string, string>;
  projectNames: Record<string, string>;
  totalCount?: number;
}

export function DashboardRecentActivity({
  logs,
  userNames,
  projectNames,
  totalCount,
}: DashboardRecentActivityProps) {
  const hasMore = (totalCount ?? logs.length) > logs.length;

  return (
    <div className="surface-card h-full">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">최근 활동</h2>
          <p className="mt-0.5 text-xs text-slate-500">프로젝트·태스크 변경 이력</p>
        </div>
        {hasMore || logs.length > 0 ? (
          <Link
            href="/activity"
            className="shrink-0 text-xs font-medium text-brand-navy hover:text-brand-cyan hover:underline"
          >
            전체 보기 →
          </Link>
        ) : null}
      </div>
      <div className="p-5">
        <ActivityLogList
          logs={logs}
          userNames={userNames}
          projectNames={projectNames}
        />
      </div>
    </div>
  );
}
