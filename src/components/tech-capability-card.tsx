import Link from "next/link";
import { format } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import { PriorityBadge } from "@/components/priority-badge";
import { ProgressBar } from "@/components/progress-bar";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { TechCategoryBadge } from "@/components/tech-category-badge";
import { TechMaturityBadge } from "@/components/tech-maturity-badge";
import {
  calculateProjectDDay,
  formatDDayLabel,
  getDDayBadgeVariant,
} from "@/lib/dashboard";
import type { TechCapability } from "@/lib/tech-capability-types";
import { cn } from "@/lib/utils";

interface TechCapabilityCardProps {
  item: TechCapability;
  ownerName: string;
}

function formatDateLabel(value: string) {
  return format(new Date(`${value}T00:00:00`), "yyyy-MM-dd");
}

const DDAY_CLASS = {
  danger: "text-red-600 bg-red-50",
  warning: "text-amber-700 bg-amber-50",
  default: "text-slate-600 bg-slate-100",
} as const;

export function TechCapabilityCard({ item, ownerName }: TechCapabilityCardProps) {
  const dDay = calculateProjectDDay(item.target_date);
  const dDayVariant = getDDayBadgeVariant(dDay, item.status);

  return (
    <Link
      href={`/tech-capabilities/${item.id}`}
      className="group surface-card flex h-full flex-col p-5 transition hover:shadow-card-hover hover:ring-1 hover:ring-brand-cyan/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <TechCategoryBadge category={item.category} />
            <TechMaturityBadge maturity={item.maturity} />
            <ProjectStatusBadge status={item.status} />
            <PriorityBadge priority={item.priority} />
          </div>
          <h3 className="mt-3 line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-brand-navy">
            {item.name}
          </h3>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand-cyan" />
      </div>

      {item.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-slate-500">{item.description}</p>
      ) : (
        <p className="mt-2 text-sm text-slate-400">개요 없음</p>
      )}

      <div className="mt-4 space-y-3">
        <ProgressBar value={item.progress} showLabel />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            {formatDateLabel(item.start_date)} ~ {formatDateLabel(item.target_date)}
          </span>
          {item.maturity !== "내재화완료" && item.status !== "완료" ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-semibold",
                DDAY_CLASS[dDayVariant],
              )}
            >
              {formatDDayLabel(dDay, item.status)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-auto border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span className="font-medium text-slate-700">{ownerName}</span>
        {item.department ? ` · ${item.department}` : null}
      </div>
    </Link>
  );
}
