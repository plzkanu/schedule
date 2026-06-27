"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Cpu, FolderKanban } from "lucide-react";
import type { ActivityLog } from "@/lib/activity-logs";
import type { DashboardData } from "@/lib/dashboard";
import type { TechDashboardData } from "@/lib/tech-dashboard";
import type { UserPublic } from "@/lib/types";
import { DashboardApproachingList } from "@/components/dashboard-approaching-list";
import { DashboardScheduleColumn } from "@/components/dashboard-team-schedule";
import { DashboardCharts } from "@/components/dashboard-charts";
import { DashboardHero } from "@/components/dashboard-hero";
import { DashboardKpiCards } from "@/components/dashboard-kpi-cards";
import { DashboardRecentActivity } from "@/components/dashboard-recent-activity";
import { DashboardStatusOverview } from "@/components/dashboard-status-overview";
import { DashboardTechHero } from "@/components/dashboard-tech-hero";
import { DashboardTechSection } from "@/components/dashboard-tech-section";
import { cn } from "@/lib/utils";

export type DashboardTab = "projects" | "tech";

interface DashboardViewProps {
  defaultTab: DashboardTab;
  userName: string;
  canWrite: boolean;
  currentUserId: string;
  assignees: UserPublic[];
  projectData: DashboardData;
  techData: TechDashboardData;
  ownerNames: Record<string, string>;
  userNames: Record<string, string>;
  projectNames: Record<string, string>;
  logs: ActivityLog[];
  activityTotal: number;
  projectsError: string | null;
  logsError: string | null;
  techError: string | null;
}

const TABS: {
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: (props: DashboardViewProps) => number;
}[] = [
  {
    id: "projects",
    label: "프로젝트",
    icon: FolderKanban,
    count: (props) => props.projectData.totalProjects,
  },
  {
    id: "tech",
    label: "기술 확보",
    icon: Cpu,
    count: (props) => props.techData.total,
  },
];

function parseTab(value: string | null): DashboardTab {
  return value === "tech" ? "tech" : "projects";
}

export function DashboardView(props: DashboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const tab = parseTab(searchParams.get("tab") ?? props.defaultTab);

  function setTab(next: DashboardTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "projects") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `/dashboard?${query}` : "/dashboard");
    });
  }

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          const count = item.count(props);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              disabled={isPending}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-brand-navy text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "projects" ? (
        <>
          {props.projectsError ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {props.projectsError}
            </p>
          ) : null}

          {props.logsError ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {props.logsError}
            </p>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,13fr)_minmax(0,7fr)] lg:items-stretch">
            <div className="flex min-w-0 flex-col gap-6 lg:h-full">
              <DashboardHero
                userName={props.userName}
                totalProjects={props.projectData.totalProjects}
                inProgressProjects={props.projectData.inProgressProjects}
                delayedProjects={props.projectData.delayedProjects}
                completionRate={props.projectData.completionRate}
                canWrite={props.canWrite}
              />

              <DashboardKpiCards data={props.projectData} />

              <div className="mt-auto">
                <DashboardStatusOverview
                  statusSummary={props.projectData.statusSummary}
                  totalProjects={props.projectData.totalProjects}
                />
              </div>
            </div>

            <DashboardScheduleColumn
              assignees={props.assignees}
              currentUserId={props.currentUserId}
              canWrite={props.canWrite}
            />
          </div>

          <DashboardCharts
            statusDistribution={props.projectData.statusDistribution}
            statusSummary={props.projectData.statusSummary}
            ownerDistribution={props.projectData.ownerDistribution}
            departmentDistribution={props.projectData.departmentDistribution}
          />

          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardApproachingList
              projects={props.projectData.approachingProjects}
              ownerNames={props.ownerNames}
            />
            <DashboardRecentActivity
              logs={props.logs}
              userNames={props.userNames}
              projectNames={props.projectNames}
              totalCount={props.activityTotal}
            />
          </div>
        </>
      ) : (
        <>
          <DashboardTechHero
            total={props.techData.total}
            inProgress={props.techData.inProgress}
            internalized={props.techData.internalized}
            internalizationRate={props.techData.internalizationRate}
            delayed={props.techData.delayed}
            canWrite={props.canWrite}
          />

          {props.techError ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {props.techError}
            </p>
          ) : null}

          <DashboardTechSection
            data={props.techData}
            ownerNames={props.ownerNames}
            showHeader={false}
          />
        </>
      )}
    </div>
  );
}
