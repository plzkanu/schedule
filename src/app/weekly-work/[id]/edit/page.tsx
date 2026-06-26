import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { WeeklyWorkForm } from "@/components/weekly-work-form";
import { canWrite, getSessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { canModifyWeeklyWork } from "@/lib/weekly-work-access";
import { getWeeklyWork } from "@/lib/weekly-work";

interface EditWeeklyWorkPageProps {
  params: { id: string };
}

export default async function EditWeeklyWorkPage({
  params,
}: EditWeeklyWorkPageProps) {
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

  const { data: item, error } = await getWeeklyWork(params.id);

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

  if (!canModifyWeeklyWork(session, item)) {
    redirect("/weekly-work");
  }

  return (
    <AppShell session={session}>
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <PageHeader
          title="주간업무 수정"
          description="등록한 주간업무 내용을 수정합니다."
          breadcrumb={[
            { label: "주간업무", href: "/weekly-work" },
            { label: "수정" },
          ]}
        />
        <WeeklyWorkForm mode="edit" item={item} />
      </div>
    </AppShell>
  );
}
