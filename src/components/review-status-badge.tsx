import { Badge } from "@/components/ui/badge";
import {
  REVIEW_STATUS_COLORS,
  type ReviewStatus,
} from "@/lib/review-types";
import { cn } from "@/lib/utils";

interface ReviewStatusBadgeProps {
  status: ReviewStatus;
  className?: string;
}

export function ReviewStatusBadge({ status, className }: ReviewStatusBadgeProps) {
  const colors = REVIEW_STATUS_COLORS[status];
  return (
    <Badge
      variant="outline"
      className={cn(colors.bg, colors.text, colors.border, "font-medium", className)}
    >
      {status}
    </Badge>
  );
}
