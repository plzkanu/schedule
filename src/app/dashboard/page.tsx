import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DashboardView, type DashboardTab } from "@/components/dashboard-view";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { listActivityLogsPaginated } from "@/lib/activity-logs";
import { canWrite, getSessionUser } from "@/lib/auth";
import { buildDashboardData } from "@/lib/dashboard";
import { listProjects } from "@/lib/projects";
import { buildTechDashboardData } from "@/lib/tech-dashboard";
import { listTechCapabilities } from "@/lib/tech-capabilities";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllUsers } from "@/lib/users-store";
import { buildUserDisplayMap, formatUserDisplayLabel } from "@/lib/user-display";
import { toPublicUser } from "@/lib/types";

interface DashboardPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseTab(value: string | undefined): DashboardTab {
  return value === "tech" ? "tech" : "projects";
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <AppShell session={session}>
        <SupabaseConfigAlert />
      </AppShell>
    );
  }

  const [
    { data: projects, error: projectsError },
    { data: logs, total: activityTotal, error: logsError },
    { data: techItems, error: techError },
  ] = await Promise.all([
    listProjects(),
    listActivityLogsPaginated(1, 5),
    listTechCapabilities(),
  ]);

  const users = await getAllUsers();
  const assignees = users
    .filter((user) => user.role === "admin" || user.role === "member")
    .map(toPublicUser);
  const userNames = buildUserDisplayMap(users);
  const ownerNames = userNames;
  const projectNames = Object.fromEntries(
    projects.map((project) => [project.id, project.name]),
  );

  const dashboard = buildDashboardData(projects, ownerNames);
  const techDashboard = buildTechDashboardData(techItems);
  const defaultTab = parseTab(getParam(searchParams.tab));

  return (
    <AppShell session={session}>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-slate-100" />}>
        <DashboardView
          defaultTab={defaultTab}
          userName={formatUserDisplayLabel(session.name, session.department)}
          canWrite={canWrite(session)}
          currentUserId={session.id}
          assignees={assignees}
          projectData={dashboard}
          techData={techDashboard}
          ownerNames={ownerNames}
          userNames={userNames}
          projectNames={projectNames}
          logs={logs}
          activityTotal={activityTotal}
          projectsError={projectsError}
          logsError={logsError}
          techError={techError}
        />
      </Suspense>
    </AppShell>
  );
}
