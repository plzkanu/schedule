import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { WeeklyWorkForm } from "@/components/weekly-work-form";
import { canWrite, getSessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function NewWeeklyWorkPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }
  if (!canWrite(session)) {
    redirect("/dashboard");
  }

  const configured = isSupabaseConfigured();

  return (
    <AppShell session={session}>
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <PageHeader
          title="주간업무 등록"
          description="프로젝트·잡무를 구분하고, 요일별 계획·실적과 야근 여부를 입력합니다."
          breadcrumb={[
            { label: "주간업무", href: "/weekly-work" },
            { label: "등록" },
          ]}
        />
        {!configured ? (
          <SupabaseConfigAlert />
        ) : (
          <WeeklyWorkForm mode="create" />
        )}
      </div>
    </AppShell>
  );
}
