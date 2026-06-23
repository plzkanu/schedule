import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_COLORS,
  type TechCategory,
} from "@/lib/tech-capability-types";
import { cn } from "@/lib/utils";

interface TechCategoryBadgeProps {
  category: TechCategory;
  className?: string;
}

export function TechCategoryBadge({ category, className }: TechCategoryBadgeProps) {
  const colors = CATEGORY_COLORS[category];
  return (
    <Badge
      variant="outline"
      className={cn(colors.bg, colors.text, colors.border, "font-medium", className)}
    >
      {category}
    </Badge>
  );
}
