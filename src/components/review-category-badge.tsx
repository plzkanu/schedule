import { Badge } from "@/components/ui/badge";
import {
  REVIEW_CATEGORY_COLORS,
  type ReviewCategory,
} from "@/lib/review-types";
import { cn } from "@/lib/utils";

interface ReviewCategoryBadgeProps {
  category: ReviewCategory;
  className?: string;
}

export function ReviewCategoryBadge({
  category,
  className,
}: ReviewCategoryBadgeProps) {
  const colors = REVIEW_CATEGORY_COLORS[category];
  return (
    <Badge
      variant="outline"
      className={cn(colors.bg, colors.text, colors.border, "font-medium", className)}
    >
      {category}
    </Badge>
  );
}
