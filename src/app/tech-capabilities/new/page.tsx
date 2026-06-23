import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { TechCapabilityForm } from "@/components/tech-capability-form";
import { canWrite, getSessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllUsers } from "@/lib/users-store";
import { toPublicUser } from "@/lib/types";

export default async function NewTechCapabilityPage() {
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
          title="새 기술 등록"
          description="AI·IT 기술 내재화 항목을 등록합니다."
          breadcrumb={[
            { label: "기술 확보", href: "/tech-capabilities" },
            { label: "새 기술 등록" },
          ]}
        />
        {!configured ? (
          <SupabaseConfigAlert />
        ) : (
          <TechCapabilityForm mode="create" assignees={assignees} />
        )}
      </div>
    </AppShell>
  );
}
