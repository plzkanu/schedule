import Link from "next/link";
import { ArrowRight, FolderKanban, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardHeroProps {
  userName: string;
  totalProjects: number;
  inProgressProjects: number;
  delayedProjects: number;
  completionRate: number;
  canWrite: boolean;
}

export function DashboardHero({
  userName,
  totalProjects,
  inProgressProjects,
  delayedProjects,
  completionRate,
  canWrite,
}: DashboardHeroProps) {
  const today = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "full",
  }).format(new Date());

  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-navy text-white shadow-card">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#009ada55,_transparent_50%),radial-gradient(circle_at_bottom_left,_#ffffff08,_transparent_40%)]"
      />
      <div className="relative flex flex-col gap-4 p-6 sm:p-8 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white/65">{today}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            안녕하세요, {userName}님
          </h1>
          <p className="mt-3 text-sm text-white/75 sm:whitespace-nowrap">
            전체 {totalProjects}개 프로젝트 · 진행중 {inProgressProjects}개 ·
            완료율 {completionRate}%
            {delayedProjects > 0
              ? ` · 지연 ${delayedProjects}건 주의`
              : " · 일정 정상"}
          </p>
        </div>

        <div className="flex shrink-0 flex-nowrap items-center gap-2 self-end sm:self-auto">
          <Link
            href="/projects"
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "border-0 bg-white/15 text-white hover:bg-white/25",
            )}
          >
            <FolderKanban className="mr-2 h-4 w-4" />
            프로젝트 보기
          </Link>
          {canWrite ? (
            <Link
              href="/projects/new"
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-brand-cyan text-white hover:bg-brand-cyan/90",
              )}
            >
              <Plus className="mr-2 h-4 w-4" />
              새 프로젝트
            </Link>
          ) : null}
        </div>
      </div>

      <div className="relative border-t border-white/10 px-6 py-3 sm:px-8">
        <Link
          href="/projects?status=지연"
          className="inline-flex items-center gap-1 text-xs text-white/60 transition hover:text-white"
        >
          지연 프로젝트 바로가기
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
