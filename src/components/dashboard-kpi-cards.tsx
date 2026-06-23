import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  type LucideIcon,
} from "lucide-react";
import type { DashboardData } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

interface DashboardKpiCardsProps {
  data: Pick<
    DashboardData,
    | "totalProjects"
    | "inProgressProjects"
    | "completedProjects"
    | "dueWithin7Days"
    | "delayedProjects"
    | "averageProgress"
    | "completionRate"
  >;
}

const KPI_ITEMS: {
  key:
    | "totalProjects"
    | "inProgressProjects"
    | "completedProjects"
    | "dueWithin7Days"
    | "delayedProjects";
  label: string;
  hint: (data: DashboardKpiCardsProps["data"]) => string;
  href: string;
  icon: LucideIcon;
  accent: string;
  iconBg: string;
}[] = [
  {
    key: "totalProjects",
    label: "전체 프로젝트",
    hint: (d) => `평균 진행률 ${d.averageProgress}%`,
    href: "/projects",
    icon: FolderKanban,
    accent: "text-brand-navy",
    iconBg: "bg-blue-50 text-brand-navy",
  },
  {
    key: "inProgressProjects",
    label: "진행중",
    hint: (d) =>
      d.totalProjects > 0
        ? `전체의 ${Math.round((d.inProgressProjects / d.totalProjects) * 100)}%`
        : "진행 중인 일정",
    href: "/projects?status=진행중",
    icon: Activity,
    accent: "text-brand-cyan",
    iconBg: "bg-sky-50 text-brand-cyan",
  },
  {
    key: "completedProjects",
    label: "완료",
    hint: (d) => `완료율 ${d.completionRate}%`,
    href: "/projects?status=완료",
    icon: CheckCircle2,
    accent: "text-emerald-600",
    iconBg: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "dueWithin7Days",
    label: "마감 임박",
    hint: () => "당월 · D-7 이내",
    href: "/projects",
    icon: CalendarClock,
    accent: "text-amber-600",
    iconBg: "bg-amber-50 text-amber-600",
  },
  {
    key: "delayedProjects",
    label: "지연",
    hint: () => "주의 필요",
    href: "/projects?status=지연",
    icon: AlertTriangle,
    accent: "text-red-600",
    iconBg: "bg-red-50 text-red-600",
  },
];

export function DashboardKpiCards({ data }: DashboardKpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {KPI_ITEMS.map((item) => {
        const Icon = item.icon;
        const value = data[item.key];
        const isAlert = item.key === "delayedProjects" && value > 0;

        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "surface-card group block p-5 transition hover:shadow-card-hover hover:ring-1 hover:ring-brand-navy/10",
              isAlert && "ring-1 ring-red-200",
            )}
          >
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  item.iconBg,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">
              {item.label}
            </p>
            <p
              className={cn(
                "mt-1 text-3xl font-bold tracking-tight",
                item.accent,
              )}
            >
              {value}
            </p>
            <p className="mt-1 text-xs text-slate-400">{item.hint(data)}</p>
          </Link>
        );
      })}
    </div>
  );
}
