import Link from "next/link";
import { format } from "date-fns";
import { CalendarRange, Pencil, User } from "lucide-react";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { PriorityBadge } from "@/components/priority-badge";
import { ProgressBar } from "@/components/progress-bar";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { TechCapabilityDeleteButton } from "@/components/tech-capability-delete-button";
import { TechCategoryBadge } from "@/components/tech-category-badge";
import { TechMaturityBadge } from "@/components/tech-maturity-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  formatDDayLabel,
  getDDayBadgeVariant,
  calculateProjectDDay,
} from "@/lib/dashboard";
import type { TechCapability } from "@/lib/tech-capability-types";
import { cn } from "@/lib/utils";

interface TechCapabilityDetailViewProps {
  item: TechCapability;
  ownerName: string;
  canWrite: boolean;
}

function formatDateLabel(value: string) {
  return format(new Date(`${value}T00:00:00`), "yyyy-MM-dd");
}

function InfoBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="mt-1.5 text-sm text-slate-700">{children}</div>
    </div>
  );
}

export function TechCapabilityDetailView({
  item,
  ownerName,
  canWrite,
}: TechCapabilityDetailViewProps) {
  const dDay = calculateProjectDDay(item.target_date);
  const dDayVariant = getDDayBadgeVariant(dDay, item.status);

  const DDAY_CLASS = {
    danger: "bg-red-500/20 text-red-100 ring-red-400/30",
    warning: "bg-amber-500/20 text-amber-100 ring-amber-400/30",
    default: "bg-white/15 text-white ring-white/20",
  } as const;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-brand-navy text-white shadow-card">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#009ada55,_transparent_55%)]"
        />
        <div className="relative p-6 sm:p-8">
          <PageBreadcrumb
            variant="light"
            items={[
              { label: "기술 확보", href: "/tech-capabilities" },
              { label: item.name },
            ]}
            className="mb-5"
          />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <TechCategoryBadge category={item.category} />
                <TechMaturityBadge maturity={item.maturity} />
                <ProjectStatusBadge status={item.status} />
                <PriorityBadge priority={item.priority} />
                {item.maturity !== "내재화완료" && item.status !== "완료" ? (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
                      DDAY_CLASS[dDayVariant],
                    )}
                  >
                    {formatDDayLabel(dDay, item.status)}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                {item.name}
              </h1>
              {item.description ? (
                <p className="mt-2 max-w-2xl text-sm text-white/75">
                  {item.description}
                </p>
              ) : null}
            </div>

            {canWrite ? (
              <Link
                href={`/tech-capabilities/${item.id}/edit`}
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white",
                })}
              >
                <Pencil className="mr-2 h-4 w-4" />
                수정
              </Link>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
              <User className="h-4 w-4 text-brand-cyan" />
              <div>
                <p className="text-xs text-white/60">담당자</p>
                <p className="text-sm font-medium">{ownerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
              <CalendarRange className="h-4 w-4 text-brand-cyan" />
              <div>
                <p className="text-xs text-white/60">내재화 목표</p>
                <p className="text-sm font-medium">
                  {formatDateLabel(item.start_date)} ~ {formatDateLabel(item.target_date)}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
              <p className="text-xs text-white/60">진행률</p>
              <ProgressBar
                value={item.progress}
                showLabel
                className="mt-2 [&_.text-slate-600]:text-white/80"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="surface-card p-6">
        <h2 className="text-sm font-semibold text-slate-800">상세 정보</h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <InfoBlock label="담당 부서">
            {item.department || "미지정"}
          </InfoBlock>
          <InfoBlock label="성숙도 단계">
            <TechMaturityBadge maturity={item.maturity} />
          </InfoBlock>
          <InfoBlock label="활용 분야">
            {item.use_cases ? (
              <p className="whitespace-pre-wrap">{item.use_cases}</p>
            ) : (
              <span className="text-slate-400">등록된 내용 없음</span>
            )}
          </InfoBlock>
          <InfoBlock label="비고">
            {item.notes ? (
              <p className="whitespace-pre-wrap">{item.notes}</p>
            ) : (
              <span className="text-slate-400">등록된 내용 없음</span>
            )}
          </InfoBlock>
        </div>
      </div>

      {canWrite ? (
        <TechCapabilityDeleteButton itemId={item.id} itemName={item.name} />
      ) : null}
    </div>
  );
}
