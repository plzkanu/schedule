import { Badge } from "@/components/ui/badge";
import type { ProjectPriority } from "@/lib/project-types";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<
  ProjectPriority,
  { bg: string; text: string; border: string }
> = {
  상: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  중: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  하: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
  },
};

interface PriorityBadgeProps {
  priority: ProjectPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const colors = PRIORITY_STYLES[priority];

  return (
    <Badge
      variant="outline"
      className={cn(
        colors.bg,
        colors.text,
        colors.border,
        "font-medium",
        className,
      )}
    >
      {priority}
    </Badge>
  );
}
