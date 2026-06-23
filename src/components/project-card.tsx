import Link from "next/link";
import { format } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import { PriorityBadge } from "@/components/priority-badge";
import { ProgressBar } from "@/components/progress-bar";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import type { Project } from "@/lib/project-types";
import {
  calculateProjectDDay,
  formatDDayLabel,
  getDDayBadgeVariant,
} from "@/lib/dashboard";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  ownerName: string;
}

function formatDateLabel(value: string) {
  return format(new Date(`${value}T00:00:00`), "yyyy-MM-dd");
}

const DDAY_CLASS = {
  danger: "text-red-600 bg-red-50",
  warning: "text-amber-700 bg-amber-50",
  default: "text-slate-600 bg-slate-100",
} as const;

export function ProjectCard({ project, ownerName }: ProjectCardProps) {
  const dDay = calculateProjectDDay(project.end_date);
  const dDayVariant = getDDayBadgeVariant(dDay, project.status);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group surface-card flex h-full flex-col p-5 transition hover:shadow-card-hover hover:ring-1 hover:ring-brand-cyan/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            <PriorityBadge priority={project.priority} />
          </div>
          <h3 className="mt-3 line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-brand-navy">
            {project.name}
          </h3>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand-cyan" />
      </div>

      {project.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
          {project.description}
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-400">설명 없음</p>
      )}

      <div className="mt-4 space-y-3">
        <ProgressBar value={project.progress} showLabel />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            {formatDateLabel(project.start_date)} ~{" "}
            {formatDateLabel(project.end_date)}
          </span>
          {project.status !== "완료" ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-semibold",
                DDAY_CLASS[dDayVariant],
              )}
            >
              {formatDDayLabel(dDay, project.status)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-auto border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span className="font-medium text-slate-700">{ownerName}</span>
        {project.department ? ` · ${project.department}` : null}
      </div>
    </Link>
  );
}
