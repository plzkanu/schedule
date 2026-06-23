import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProjectDeleteButton } from "@/components/project-delete-button";
import { ProjectForm } from "@/components/project-form";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { canWrite, getSessionUser } from "@/lib/auth";
import { getProject } from "@/lib/projects";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllUsers } from "@/lib/users-store";
import { toPublicUser } from "@/lib/types";

interface EditProjectPageProps {
  params: { id: string };
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  if (!canWrite(session)) {
    redirect("/dashboard");
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

  return (
    <AppShell session={session}>
      <div className="mx-auto max-w-3xl space-y-8">
        <PageHeader
          title="프로젝트 수정"
          description={project.name}
          breadcrumb={[
            { label: "프로젝트", href: "/projects" },
            { label: project.name, href: `/projects/${project.id}` },
            { label: "수정" },
          ]}
        />
        <ProjectForm mode="edit" project={project} assignees={assignees} />
        <ProjectDeleteButton
          projectId={project.id}
          projectName={project.name}
        />
      </div>
    </AppShell>
  );
}
