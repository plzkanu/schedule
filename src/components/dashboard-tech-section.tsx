"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarClock, Cpu, Sparkles, Target, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/priority-badge";
import { ProgressBar } from "@/components/progress-bar";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { TechCategoryBadge } from "@/components/tech-category-badge";
import { TechMaturityBadge } from "@/components/tech-maturity-badge";
import {
  formatDDayLabel,
  getDDayBadgeVariant,
} from "@/lib/dashboard";
import {
  CHART_CATEGORY_COLORS,
  CHART_MATURITY_COLORS,
} from "@/lib/tech-capability-types";
import type { TechDashboardData } from "@/lib/tech-dashboard";
import { resolveUserDisplayLabel } from "@/lib/user-display";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DashboardTechSectionProps {
  data: TechDashboardData;
  ownerNames: Record<string, string>;
  showHeader?: boolean;
}

const DDAY_BADGE_CLASS = {
  danger: "border-red-200 bg-red-100 text-red-700",
  warning: "border-amber-200 bg-amber-100 text-amber-800",
  default: "border-slate-200 bg-slate-100 text-slate-700",
} as const;

function formatDateLabel(value: string) {
  return format(new Date(`${value}T00:00:00`), "yyyy-MM-dd");
}

export function DashboardTechSection({
  data,
  ownerNames,
  showHeader = true,
}: DashboardTechSectionProps) {
  const maturityBarData = data.maturitySummary.filter((item) => item.count > 0);

  return (
    <section className="space-y-4">
      {showHeader ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-brand-cyan" />
              <h2 className="text-lg font-semibold text-slate-900">기술 확보 현황</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              AI·IT 기술 내재화 진행 상황을 한눈에 확인합니다.
            </p>
          </div>
          <Link
            href="/tech-capabilities"
            className="text-sm font-medium text-brand-navy hover:text-brand-cyan"
          >
            전체 보기 →
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "전체 기술",
            value: data.total,
            hint: `평균 진행률 ${data.averageProgress}%`,
            icon: Cpu,
            accent: "text-brand-navy",
            iconBg: "bg-blue-50 text-brand-navy",
            href: "/tech-capabilities",
          },
          {
            label: "내재화 완료",
            value: data.internalized,
            hint: `내재화율 ${data.internalizationRate}%`,
            icon: Sparkles,
            accent: "text-emerald-600",
            iconBg: "bg-emerald-50 text-emerald-600",
            href: "/tech-capabilities?maturity=내재화완료",
          },
          {
            label: "파일럿 이상",
            value: data.pilotOrAbove,
            hint: `진행중 ${data.inProgress}건`,
            icon: TrendingUp,
            accent: "text-brand-cyan",
            iconBg: "bg-sky-50 text-brand-cyan",
            href: "/tech-capabilities",
          },
          {
            label: "지연",
            value: data.delayed,
            hint: "상태 기준",
            icon: Target,
            accent: "text-red-600",
            iconBg: "bg-red-50 text-red-600",
            href: "/tech-capabilities?status=지연",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="surface-card block p-5 transition hover:shadow-card-hover hover:ring-1 hover:ring-brand-navy/10"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  item.iconBg,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500">
                {item.label}
              </p>
              <p className={cn("mt-1 text-3xl font-bold tracking-tight", item.accent)}>
                {item.value}
              </p>
              <p className="mt-1 text-xs text-slate-400">{item.hint}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="surface-card lg:col-span-2">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-800">기술 분야</h3>
            <p className="mt-0.5 text-xs text-slate-500">분야별 구성</p>
          </div>
          <div className="p-4">
            {data.categoryDistribution.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                등록된 기술이 없습니다.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data.categoryDistribution}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {data.categoryDistribution.map((entry) => (
                      <Cell
                        key={entry.category}
                        fill={CHART_CATEGORY_COLORS[entry.category]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="surface-card lg:col-span-3">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-800">성숙도 단계</h3>
            <p className="mt-0.5 text-xs text-slate-500">탐색 → 내재화완료</p>
          </div>
          <div className="p-4">
            {maturityBarData.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                등록된 기술이 없습니다.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={maturityBarData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="maturity"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {maturityBarData.map((entry) => (
                      <Cell
                        key={entry.maturity}
                        fill={CHART_MATURITY_COLORS[entry.maturity]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="surface-card">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <CalendarClock className="h-4 w-4 text-brand-cyan" />
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              내재화 목표 임박 · 지연
            </h3>
            <p className="text-xs text-slate-500">D-14 이내 및 지연 항목</p>
          </div>
        </div>
        <div className="p-5">
          {data.approachingItems.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm font-medium text-slate-600">
                목표 임박 항목이 없습니다
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {data.approachingItems.slice(0, 5).map((item) => {
                const variant = getDDayBadgeVariant(item.dDay, item.status);
                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-brand-cyan/30 hover:bg-white"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/tech-capabilities/${item.id}`}
                            className="font-semibold text-brand-navy hover:text-brand-cyan hover:underline"
                          >
                            {item.name}
                          </Link>
                          <TechCategoryBadge category={item.category} />
                          <TechMaturityBadge maturity={item.maturity} />
                          <ProjectStatusBadge status={item.status} />
                          <PriorityBadge priority={item.priority} />
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500">
                          목표 {formatDateLabel(item.target_date)} ·{" "}
                          {resolveUserDisplayLabel(ownerNames, item.owner_id, "담당자 미지정")}
                        </p>
                        <ProgressBar
                          value={item.progress}
                          showLabel
                          className="mt-3 max-w-xs"
                        />
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 font-semibold",
                          DDAY_BADGE_CLASS[variant],
                        )}
                      >
                        {formatDDayLabel(item.dDay, item.status)}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
