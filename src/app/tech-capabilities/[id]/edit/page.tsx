import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { TechCapabilityForm } from "@/components/tech-capability-form";
import { canWrite, getSessionUser } from "@/lib/auth";
import { getTechCapability } from "@/lib/tech-capabilities";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllUsers } from "@/lib/users-store";
import { toPublicUser } from "@/lib/types";

interface EditTechCapabilityPageProps {
  params: { id: string };
}

export default async function EditTechCapabilityPage({
  params,
}: EditTechCapabilityPageProps) {
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

  const { data: item, error } = await getTechCapability(params.id);

  if (error) {
    return (
      <AppShell session={session}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      </AppShell>
    );
  }

  if (!item) {
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
          title="기술 확보 수정"
          description={item.name}
          breadcrumb={[
            { label: "기술 확보", href: "/tech-capabilities" },
            { label: item.name, href: `/tech-capabilities/${item.id}` },
            { label: "수정" },
          ]}
        />
        <TechCapabilityForm mode="edit" item={item} assignees={assignees} />
      </div>
    </AppShell>
  );
}
