import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProjectForm } from "@/components/project-form";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { canWrite, getSessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllUsers } from "@/lib/users-store";
import { toPublicUser } from "@/lib/types";

export default async function NewProjectPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  if (!canWrite(session)) {
    redirect("/dashboard");
  }

  const configured = isSupabaseConfigured();
  const users = await getAllUsers();
  const assignees = users
    .filter((user) => user.role === "admin" || user.role === "member")
    .map(toPublicUser);

  return (
    <AppShell session={session}>
      <div className="mx-auto max-w-3xl space-y-8">
        <PageHeader
          title="새 프로젝트"
          description="IT 프로젝트를 등록하고 일정 관리를 시작합니다."
          breadcrumb={[
            { label: "프로젝트", href: "/projects" },
            { label: "새 프로젝트" },
          ]}
        />
        {!configured ? <SupabaseConfigAlert /> : <ProjectForm mode="create" assignees={assignees} />}
      </div>
    </AppShell>
  );
}
