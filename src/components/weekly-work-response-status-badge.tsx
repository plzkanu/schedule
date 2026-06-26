import { cn } from "@/lib/utils";
import {
  WEEKLY_WORK_RESPONSE_STATUS_LABELS,
  type WeeklyWorkResponseStatus,
} from "@/lib/weekly-work-comment-types";

const STATUS_STYLES: Record<WeeklyWorkResponseStatus, string> = {
  review: "bg-slate-100 text-slate-700 ring-slate-200",
  in_progress: "bg-blue-50 text-blue-700 ring-blue-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

interface WeeklyWorkResponseStatusBadgeProps {
  status: WeeklyWorkResponseStatus;
  className?: string;
}

export function WeeklyWorkResponseStatusBadge({
  status,
  className,
}: WeeklyWorkResponseStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        STATUS_STYLES[status],
        className,
      )}
    >
      {WEEKLY_WORK_RESPONSE_STATUS_LABELS[status]}
    </span>
  );
}
