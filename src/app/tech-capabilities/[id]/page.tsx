import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { TechCapabilityDetailView } from "@/components/tech-capability-detail-view";
import { canWrite, getSessionUser } from "@/lib/auth";
import { getTechCapability } from "@/lib/tech-capabilities";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllUsers } from "@/lib/users-store";
import { buildUserDisplayMap, resolveUserDisplayLabel } from "@/lib/user-display";

interface TechCapabilityDetailPageProps {
  params: { id: string };
}

export default async function TechCapabilityDetailPage({
  params,
}: TechCapabilityDetailPageProps) {
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
  const userNames = buildUserDisplayMap(users);
  const ownerName = resolveUserDisplayLabel(userNames, item.owner_id, "미지정");

  return (
    <AppShell session={session}>
      <TechCapabilityDetailView
        item={item}
        ownerName={ownerName}
        canWrite={canWrite(session)}
      />
    </AppShell>
  );
}
