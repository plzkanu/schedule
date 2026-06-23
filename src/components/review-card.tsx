import Link from "next/link";
import { format } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import { PriorityBadge } from "@/components/priority-badge";
import { ReviewCategoryBadge } from "@/components/review-category-badge";
import { ReviewStatusBadge } from "@/components/review-status-badge";
import {
  calculateProjectDDay,
  formatDDayLabel,
  getDDayBadgeVariant,
} from "@/lib/dashboard";
import { isActiveReview } from "@/lib/review-sort";
import type { Review } from "@/lib/review-types";
import { cn } from "@/lib/utils";

interface ReviewCardProps {
  item: Review;
  reviewerName: string;
  requesterName: string;
}

function formatDateLabel(value: string) {
  return format(new Date(`${value}T00:00:00`), "yyyy-MM-dd");
}

const DDAY_CLASS = {
  danger: "text-red-600 bg-red-50",
  warning: "text-amber-700 bg-amber-50",
  default: "text-slate-600 bg-slate-100",
} as const;

export function ReviewCard({ item, reviewerName, requesterName }: ReviewCardProps) {
  const dDay = calculateProjectDDay(item.target_date);
  const dDayVariant = getDDayBadgeVariant(
    dDay,
    item.status === "보류" ? "보류" : item.status === "반려" ? "지연" : "진행중",
  );

  return (
    <Link
      href={`/reviews/${item.id}`}
      className="group surface-card flex h-full flex-col p-5 transition hover:shadow-card-hover hover:ring-1 hover:ring-violet-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ReviewCategoryBadge category={item.category} />
            <ReviewStatusBadge status={item.status} />
            <PriorityBadge priority={item.priority} />
          </div>
          <h3 className="mt-3 line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-brand-navy">
            {item.title}
          </h3>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-violet-500" />
      </div>

      {item.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-slate-500">{item.description}</p>
      ) : (
        <p className="mt-2 text-sm text-slate-400">요청 개요 없음</p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          요청 {formatDateLabel(item.requested_date)} · 목표 {formatDateLabel(item.target_date)}
        </span>
        {isActiveReview(item) ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-semibold",
              DDAY_CLASS[dDayVariant],
            )}
          >
            {formatDDayLabel(dDay, "진행중")}
          </span>
        ) : null}
      </div>

      <div className="mt-auto border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span className="font-medium text-slate-700">{reviewerName}</span>
        {item.request_department ? ` · ${item.request_department}` : null}
        <span className="mx-1">·</span>
        요청 {requesterName}
      </div>
    </Link>
  );
}
