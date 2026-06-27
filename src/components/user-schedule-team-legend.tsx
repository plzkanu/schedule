"use client";

import { formatUserDisplayLabel } from "@/lib/user-display";
import type { UserPublic } from "@/lib/types";
import { cn } from "@/lib/utils";

interface UserScheduleTeamLegendProps {
  assignees: UserPublic[];
  colorMap: Record<string, string>;
  canEditColors: boolean;
  compact?: boolean;
  onColorChange: (userId: string, color: string) => void;
}

export function UserScheduleTeamLegend({
  assignees,
  colorMap,
  canEditColors,
  compact = false,
  onColorChange,
}: UserScheduleTeamLegendProps) {
  if (assignees.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
      {assignees.map((user) => {
        const color = colorMap[user.id] ?? "#64748b";
        const label = formatUserDisplayLabel(user.name, user.department);

        return (
          <div
            key={user.id}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm",
              compact && "px-1.5",
            )}
          >
            <label
              className={cn(
                "relative inline-flex shrink-0",
                canEditColors ? "cursor-pointer" : "cursor-default",
              )}
              title={canEditColors ? `${label} 색상 변경` : label}
            >
              <span
                className="block h-3 w-3 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: color }}
              />
              {canEditColors ? (
                <input
                  type="color"
                  value={color}
                  onChange={(event) =>
                    onColorChange(user.id, event.target.value)
                  }
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label={`${label} 표시 색상`}
                />
              ) : null}
            </label>

            <span
              className={cn(
                "truncate text-[11px] font-medium text-slate-700 sm:text-xs",
                compact ? "max-w-[80px]" : "max-w-[120px] sm:max-w-none",
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
