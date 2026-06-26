import { Badge } from "@/components/ui/badge";
import {
  WEEKLY_WORK_TYPE_LABELS,
  type WeeklyWorkType,
} from "@/lib/weekly-work-types";
import { cn } from "@/lib/utils";

interface WeeklyWorkTypeBadgeProps {
  workType: WeeklyWorkType;
  className?: string;
}

export function WeeklyWorkTypeBadge({
  workType,
  className,
}: WeeklyWorkTypeBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        workType === "project"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-amber-200 bg-amber-50 text-amber-800",
        className,
      )}
    >
      {WEEKLY_WORK_TYPE_LABELS[workType]}
    </Badge>
  );
}
