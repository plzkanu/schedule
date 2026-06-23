import { Badge } from "@/components/ui/badge";
import {
  MATURITY_COLORS,
  type TechMaturity,
} from "@/lib/tech-capability-types";
import { cn } from "@/lib/utils";

interface TechMaturityBadgeProps {
  maturity: TechMaturity;
  className?: string;
}

export function TechMaturityBadge({ maturity, className }: TechMaturityBadgeProps) {
  const colors = MATURITY_COLORS[maturity];
  return (
    <Badge
      variant="outline"
      className={cn(colors.bg, colors.text, colors.border, "font-medium", className)}
    >
      {maturity}
    </Badge>
  );
}
