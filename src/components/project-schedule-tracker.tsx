import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import { ProgressBar } from "@/components/progress-bar";
import type { Project } from "@/lib/project-types";

interface ProjectScheduleTrackerProps {
  project: Project;
}

export function ProjectScheduleTracker({ project }: ProjectScheduleTrackerProps) {
  const today = startOfDay(new Date());
  const start = startOfDay(parseISO(project.start_date));
  const end = startOfDay(parseISO(project.end_date));
  const totalDays = Math.max(differenceInCalendarDays(end, start), 1);
  const elapsedDays = differenceInCalendarDays(today, start);
  const timeElapsedPct = Math.min(
    100,
    Math.max(0, Math.round((elapsedDays / totalDays) * 100)),
  );

  const isBehind =
    project.progress < timeElapsedPct - 10 && project.status !== "완료";

  return (
    <div className="surface-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">일정 대비 진행</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            전체 기간 대비 경과·작업 진행률을 비교합니다.
          </p>
        </div>
        {isBehind ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
            일정 대비 지연 가능
          </span>
        ) : project.status === "완료" ? (
          <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600 ring-1 ring-green-200">
            완료
          </span>
        ) : project.status === "진행중" ? (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 ring-1 ring-blue-200">
            진행중
          </span>
        ) : (
          <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            정상 진행
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">작업 진행률</p>
          <p className="mt-1 text-2xl font-bold text-brand-navy">
            {project.progress}%
          </p>
          <ProgressBar value={project.progress} className="mt-3" />
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">일정 경과</p>
          <p className="mt-1 text-2xl font-bold text-slate-700">
            {timeElapsedPct}%
          </p>
          <ProgressBar
            value={timeElapsedPct}
            className="mt-3"
            barClassName="bg-slate-400"
          />
        </div>
      </div>
    </div>
  );
}
