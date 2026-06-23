import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS, type ProjectStatus } from "@/lib/project-types";
import { cn } from "@/lib/utils";

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function ProjectStatusBadge({
  status,
  className,
}: ProjectStatusBadgeProps) {
  const colors = STATUS_COLORS[status];

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
      {status}
    </Badge>
  );
}
