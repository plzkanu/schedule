import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProjectDetailView } from "@/components/project-detail-view";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { listProjectActivityLogs } from "@/lib/activity-logs";
import { canWrite, getSessionUser } from "@/lib/auth";
import { listProjectIssues } from "@/lib/issues";
import { getProject } from "@/lib/projects";
import { listProjectTasks } from "@/lib/tasks";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllUsers } from "@/lib/users-store";
import { toPublicUser } from "@/lib/types";
import { buildUserDisplayMap } from "@/lib/user-display";

interface ProjectDetailPageProps {
  params: { id: string };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
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

  const { data: project, error } = await getProject(params.id);

  if (error) {
    return (
      <AppShell session={session}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      </AppShell>
    );
  }

  if (!project) {
    notFound();
  }

  const users = await getAllUsers();
  const assignees = users
    .filter((user) => user.role === "admin" || user.role === "member")
    .map(toPublicUser);
  const userNames = buildUserDisplayMap(users);
  const ownerName = project.owner_id
    ? (userNames[project.owner_id] ?? "-")
    : "-";

  const [{ data: tasks }, { data: issues }, { data: logs }] = await Promise.all([
    listProjectTasks(project.id),
    listProjectIssues(project.id),
    listProjectActivityLogs(project.id),
  ]);

  return (
    <AppShell session={session}>
      <ProjectDetailView
        project={project}
        initialTasks={tasks}
        initialIssues={issues}
        initialLogs={logs}
        assignees={assignees}
        userNames={userNames}
        ownerName={ownerName}
        canWrite={canWrite(session)}
        currentUserId={session.id}
      />
    </AppShell>
  );
}
