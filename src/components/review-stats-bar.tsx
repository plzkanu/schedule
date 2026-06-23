"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { REVIEW_STATUSES, type ReviewStatus } from "@/lib/review-types";
import { REVIEW_STATUS_COLORS } from "@/lib/review-types";
import { cn } from "@/lib/utils";

interface ReviewStatsBarProps {
  counts: Record<ReviewStatus, number>;
  total: number;
  activeCount: number;
}

export function ReviewStatsBar({ counts, total, activeCount }: ReviewStatsBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeStatus = searchParams.get("status") ?? "";

  function handleStatusClick(status: ReviewStatus | "") {
    const params = new URLSearchParams(searchParams.toString());
    if (status && activeStatus !== status) params.set("status", status);
    else params.delete("status");
    router.push(`/reviews?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
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
      <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 ring-1 ring-violet-200">
        진행 중 {activeCount}
      </span>
      {REVIEW_STATUSES.map((status) => {
        const colors = REVIEW_STATUS_COLORS[status];
        const isActive = activeStatus === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => handleStatusClick(status)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition",
              isActive
                ? cn(colors.bg, colors.text, colors.border, "shadow-sm")
                : cn("bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"),
            )}
          >
            {status} {counts[status]}
          </button>
        );
      })}
    </div>
  );
}
