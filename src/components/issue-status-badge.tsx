import { Badge } from "@/components/ui/badge";
import {
  ISSUE_STATUS_COLORS,
  type IssueStatus,
} from "@/lib/issue-types";
import { cn } from "@/lib/utils";

interface IssueStatusBadgeProps {
  status: IssueStatus;
  className?: string;
}

export function IssueStatusBadge({ status, className }: IssueStatusBadgeProps) {
  const colors = ISSUE_STATUS_COLORS[status];
  return (
    <Badge
      variant="outline"
      className={cn(colors.bg, colors.text, colors.border, "font-medium", className)}
    >
      {status}
    </Badge>
  );
}
