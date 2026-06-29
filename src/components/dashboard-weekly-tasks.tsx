import Link from "next/link";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import {
  formatDDayLabel,
  getDDayBadgeVariant,
  type ProjectWeeklyTasks,
} from "@/lib/dashboard";
import { resolveUserDisplayLabel } from "@/lib/user-display";
import { cn } from "@/lib/utils";

interface DashboardWeeklyTasksProps {
  groups: ProjectWeeklyTasks[];
  userNames: Record<string, string>;
}

const WEEK_STARTS_ON = 0 as const;

const DDAY_BADGE_CLASS = {
  danger: "border-red-200 bg-red-100 text-red-700",
  warning: "border-amber-200 bg-amber-100 text-amber-800",
  default: "border-slate-200 bg-slate-100 text-slate-700",
} as const;

function formatDateLabel(value: string) {
  return format(new Date(`${value}T00:00:00`), "MM-dd (EEE)", { locale: ko });
}

function getWeekRangeLabel() {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON });
  const end = endOfWeek(today, { weekStartsOn: WEEK_STARTS_ON });
  return `${format(start, "M/d (EEE)", { locale: ko })} ~ ${format(end, "M/d (EEE)", { locale: ko })}`;
}

export function DashboardWeeklyTasks({
  groups,
  userNames,
}: DashboardWeeklyTasksProps) {
  const totalTasks = groups.reduce((sum, group) => sum + group.tasks.length, 0);

  return (
    <div className="surface-card h-full">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <CalendarClock className="h-4 w-4 text-brand-cyan" />
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            이번 주 마감 Task
          </h2>
          <p className="text-xs text-slate-500">{getWeekRangeLabel()}</p>
        </div>
      </div>
      <div className="p-5">
        {totalTasks === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-slate-600">
              이번 주 마감 Task가 없습니다
            </p>
            <p className="mt-1 text-xs text-slate-400">
              이번 주 종료 예정인 태스크가 없습니다.
            </p>
          </div>
        ) : (
          <ul className="space-y-5">
            {groups.map((group) => (
              <li key={group.projectId}>
                <Link
                  href={`/projects/${group.projectId}`}
                  className="text-sm font-semibold text-brand-navy hover:text-brand-cyan hover:underline"
                >
                  {group.projectName}
                </Link>
                <ul className="mt-2 space-y-2">
                  {group.tasks.map((task) => {
                    const variant = getDDayBadgeVariant(task.dDay, task.status);

                    return (
                      <li
                        key={task.id}
                        className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5 transition hover:border-brand-cyan/30 hover:bg-white"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-slate-800">
                                {task.name}
                              </p>
                              <ProjectStatusBadge status={task.status} />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              마감 {formatDateLabel(task.end_date)}
                              {" · "}
                              {resolveUserDisplayLabel(
                                userNames,
                                task.assignee_id,
                                "담당자 미지정",
                              )}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 font-semibold",
                              DDAY_BADGE_CLASS[variant],
                            )}
                          >
                            {formatDDayLabel(task.dDay, task.status)}
                          </Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
