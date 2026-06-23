import Link from "next/link";
import { format } from "date-fns";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/priority-badge";
import { ProgressBar } from "@/components/progress-bar";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import {
  formatDDayLabel,
  getDDayBadgeVariant,
  type ApproachingProject,
} from "@/lib/dashboard";
import { cn } from "@/lib/utils";

interface DashboardApproachingListProps {
  projects: ApproachingProject[];
  ownerNames: Record<string, string>;
}

const DDAY_BADGE_CLASS = {
  danger: "border-red-200 bg-red-100 text-red-700",
  warning: "border-amber-200 bg-amber-100 text-amber-800",
  default: "border-slate-200 bg-slate-100 text-slate-700",
} as const;

function formatDateLabel(value: string) {
  return format(new Date(`${value}T00:00:00`), "yyyy-MM-dd");
}

export function DashboardApproachingList({
  projects,
  ownerNames,
}: DashboardApproachingListProps) {
  return (
    <div className="surface-card h-full">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <CalendarClock className="h-4 w-4 text-brand-cyan" />
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            마감 임박 · 지연
          </h2>
          <p className="text-xs text-slate-500">D-7 이내 및 지연 프로젝트</p>
        </div>
      </div>
      <div className="p-5">
        {projects.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-slate-600">
              마감 임박 프로젝트가 없습니다
            </p>
            <p className="mt-1 text-xs text-slate-400">
              모든 일정이 여유롭게 관리되고 있습니다.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {projects.slice(0, 6).map((project) => {
              const variant = getDDayBadgeVariant(project.dDay, project.status);
              return (
                <li
                  key={project.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-brand-cyan/30 hover:bg-white"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-semibold text-brand-navy hover:text-brand-cyan hover:underline"
                        >
                          {project.name}
                        </Link>
                        <ProjectStatusBadge status={project.status} />
                        <PriorityBadge priority={project.priority} />
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">
                        마감 {formatDateLabel(project.end_date)} ·{" "}
                        {project.owner_id
                          ? (ownerNames[project.owner_id] ?? project.owner_id)
                          : "담당자 미지정"}
                      </p>
                      <ProgressBar
                        value={project.progress}
                        showLabel
                        className="mt-3 max-w-xs"
                      />
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 font-semibold",
                        DDAY_BADGE_CLASS[variant],
                      )}
                    >
                      {formatDDayLabel(project.dDay, project.status)}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {projects.length > 6 ? (
          <Link
            href="/projects"
            className="mt-4 block text-center text-xs font-medium text-brand-navy hover:text-brand-cyan"
          >
            +{projects.length - 6}건 더 보기
          </Link>
        ) : null}
      </div>
    </div>
  );
}
