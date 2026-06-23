"use client";

import Link from "next/link";
import { format } from "date-fns";
import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import { CalendarRange, ListTodo, Pencil, Plus, User } from "lucide-react";
import type { Project } from "@/lib/project-types";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { PriorityBadge } from "@/components/priority-badge";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  formatDDayLabel,
  getDDayBadgeVariant,
} from "@/lib/dashboard";
import { cn } from "@/lib/utils";

interface ProjectDetailHeroProps {
  project: Project;
  ownerName: string;
  taskCount: number;
  canWrite: boolean;
  onAddTask: () => void;
}

function formatDateLabel(value: string) {
  return format(new Date(`${value}T00:00:00`), "yyyy-MM-dd");
}

export function ProjectDetailHero({
  project,
  ownerName,
  taskCount,
  canWrite,
  onAddTask,
}: ProjectDetailHeroProps) {
  const today = startOfDay(new Date());
  const end = startOfDay(parseISO(project.end_date));
  const dDay = differenceInCalendarDays(end, today);
  const dDayVariant = getDDayBadgeVariant(dDay, project.status);

  const DDAY_CLASS = {
    danger: "bg-red-500/20 text-red-100 ring-red-400/30",
    warning: "bg-amber-500/20 text-amber-100 ring-amber-400/30",
    default: "bg-white/15 text-white ring-white/20",
  } as const;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-navy text-white shadow-card">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#009ada55,_transparent_55%)]"
      />
      <div className="relative p-6 sm:p-8">
        <PageBreadcrumb
          variant="light"
          items={[
            { label: "프로젝트", href: "/projects" },
            { label: project.name },
          ]}
          className="mb-5"
        />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <ProjectStatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
              {project.status !== "완료" ? (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
                    DDAY_CLASS[dDayVariant],
                  )}
                >
                  {formatDDayLabel(dDay, project.status)}
                </span>
              ) : null}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              {project.name}
            </h1>
            <p className="mt-2 text-sm text-white/70">
              {formatDateLabel(project.start_date)} ~{" "}
              {formatDateLabel(project.end_date)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center">
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="#009ada"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(project.progress / 100) * 213.6} 213.6`}
                  />
                </svg>
                <span className="text-lg font-bold">{project.progress}%</span>
              </div>
              <p className="mt-1 text-xs text-white/60">진행률</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {canWrite ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={onAddTask}
                    className="bg-brand-cyan text-white hover:bg-brand-cyan/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    태스크 추가
                  </Button>
                  <Link
                    href={`/projects/${project.id}/edit`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "border-white/25 bg-transparent text-white hover:bg-white/10",
                    )}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    수정
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
            <User className="h-4 w-4 text-brand-cyan" />
            <div>
              <p className="text-xs text-white/60">담당자</p>
              <p className="text-sm font-semibold">{ownerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
            <CalendarRange className="h-4 w-4 text-brand-cyan" />
            <div>
              <p className="text-xs text-white/60">부서</p>
              <p className="text-sm font-semibold">
                {project.department ?? "-"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
            <ListTodo className="h-4 w-4 text-brand-cyan" />
            <div>
              <p className="text-xs text-white/60">태스크</p>
              <p className="text-sm font-semibold">{taskCount}건</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
