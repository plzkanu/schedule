import Link from "next/link";
import type { ProjectStatus } from "@/lib/project-types";
import { STATUS_COLORS } from "@/lib/project-types";
import { cn } from "@/lib/utils";

interface DashboardStatusOverviewProps {
  statusSummary: { status: ProjectStatus; count: number }[];
  totalProjects: number;
}

export function DashboardStatusOverview({
  statusSummary,
  totalProjects,
}: DashboardStatusOverviewProps) {
  return (
    <div className="surface-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">상태별 현황</h2>
        <Link
          href="/projects"
          className="text-xs font-medium text-brand-navy hover:text-brand-cyan"
        >
          전체 보기 →
        </Link>
      </div>

      <div className="mb-4 flex h-2 overflow-hidden rounded-full bg-slate-100">
        {totalProjects === 0 ? (
          <div className="h-full w-full bg-slate-200" />
        ) : (
          statusSummary.map((item) => {
            if (item.count === 0) {
              return null;
            }
            const width = (item.count / totalProjects) * 100;
            const barColors: Record<ProjectStatus, string> = {
              계획: "bg-slate-400",
              진행중: "bg-blue-500",
              보류: "bg-amber-400",
              완료: "bg-green-500",
              지연: "bg-red-500",
            };
            return (
              <div
                key={item.status}
                className={cn("h-full transition-all", barColors[item.status])}
                style={{ width: `${width}%` }}
                title={`${item.status} ${item.count}건`}
              />
            );
          })
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {statusSummary.map((item) => {
          const colors = STATUS_COLORS[item.status];
          return (
            <Link
              key={item.status}
              href={
                item.count > 0 ? `/projects?status=${item.status}` : "/projects"
              }
              className={cn(
                "rounded-xl border px-3 py-3 text-center transition hover:shadow-sm",
                colors.bg,
                colors.border,
                item.count === 0 && "opacity-50",
              )}
            >
              <p className={cn("text-xs font-medium", colors.text)}>
                {item.status}
              </p>
              <p className={cn("mt-1 text-xl font-bold", colors.text)}>
                {item.count}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
