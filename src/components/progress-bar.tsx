import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  className,
  barClassName,
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div
          className={cn(
            "h-full rounded-full bg-brand-cyan transition-all",
            barClassName,
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel ? (
        <span className="w-10 shrink-0 text-right text-xs font-medium text-slate-600">
          {clamped}%
        </span>
      ) : null}
    </div>
  );
}
