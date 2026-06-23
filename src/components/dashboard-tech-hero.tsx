import Link from "next/link";
import { ArrowRight, Cpu, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardTechHeroProps {
  total: number;
  inProgress: number;
  internalized: number;
  internalizationRate: number;
  delayed: number;
  canWrite: boolean;
}

export function DashboardTechHero({
  total,
  inProgress,
  internalized,
  internalizationRate,
  delayed,
  canWrite,
}: DashboardTechHeroProps) {
  const today = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "full",
  }).format(new Date());

  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-navy text-white shadow-card">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#009ada55,_transparent_50%),radial-gradient(circle_at_bottom_left,_#ffffff08,_transparent_40%)]"
      />
      <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-white/65">{today}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            기술 확보 현황
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            전체 {total}개 기술 · 진행중 {inProgress}개 · 내재화 완료{" "}
            {internalized}개 ({internalizationRate}%)
            {delayed > 0
              ? ` · 지연 ${delayed}건 주의`
              : " · 일정 정상"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/tech-capabilities"
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "border-0 bg-white/15 text-white hover:bg-white/25",
            )}
          >
            <Cpu className="mr-2 h-4 w-4" />
            기술 확보 보기
          </Link>
          {canWrite ? (
            <Link
              href="/tech-capabilities/new"
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-brand-cyan text-white hover:bg-brand-cyan/90",
              )}
            >
              <Plus className="mr-2 h-4 w-4" />
              새 기술 등록
            </Link>
          ) : null}
        </div>
      </div>

      <div className="relative border-t border-white/10 px-6 py-3 sm:px-8">
        <Link
          href="/tech-capabilities?status=지연"
          className="inline-flex items-center gap-1 text-xs text-white/60 transition hover:text-white"
        >
          지연 기술 바로가기
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
