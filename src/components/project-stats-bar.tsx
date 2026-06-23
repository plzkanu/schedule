"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/project-types";
import { cn } from "@/lib/utils";

interface ProjectStatsBarProps {
  counts: Record<ProjectStatus, number>;
  total: number;
}

const STATUS_FILTER_STYLES: Record<
  ProjectStatus,
  { idle: string; active: string }
> = {
  계획: {
    idle: "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
    active: "bg-slate-500 text-white shadow-sm ring-0",
  },
  진행중: {
    idle: "bg-blue-50 text-blue-600 ring-blue-200 hover:bg-blue-100",
    active: "bg-blue-500 text-white shadow-sm ring-0",
  },
  보류: {
    idle: "bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100",
    active: "bg-amber-500 text-white shadow-sm ring-0",
  },
  완료: {
    idle: "bg-green-50 text-green-600 ring-green-200 hover:bg-green-100",
    active: "bg-green-500 text-white shadow-sm ring-0",
  },
  지연: {
    idle: "bg-red-50 text-red-600 ring-red-200 hover:bg-red-100",
    active: "bg-red-500 text-white shadow-sm ring-0",
  },
};

export function ProjectStatsBar({ counts, total }: ProjectStatsBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeStatus = searchParams.get("status") ?? "";

  function handleStatusClick(status: ProjectStatus | "") {
    const params = new URLSearchParams(searchParams.toString());
    if (status && activeStatus !== status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    router.push(`/projects?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => handleStatusClick("")}
        className={cn(
          "rounded-full px-3 py-1.5 text-xs font-medium transition",
          !activeStatus
            ? "bg-brand-navy text-white shadow-sm"
            : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
        )}
      >
        전체 {total}
      </button>
      {PROJECT_STATUSES.map((status) => {
        const isActive = activeStatus === status;
        const styles = STATUS_FILTER_STYLES[status];
        return (
          <button
            key={status}
            type="button"
            onClick={() => handleStatusClick(status)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition",
              isActive ? styles.active : styles.idle,
            )}
          >
            {status} {counts[status]}
          </button>
        );
      })}
    </div>
  );
}
