import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ReviewForm } from "@/components/review-form";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { canWrite, getSessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllUsers } from "@/lib/users-store";
import { toPublicUser } from "@/lib/types";

export default async function NewReviewPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (!canWrite(session)) redirect("/dashboard");

  const configured = isSupabaseConfigured();
  const users = await getAllUsers();
  const assignees = users
    .filter((user) => user.role === "admin" || user.role === "member")
    .map(toPublicUser);

  return (
    <AppShell session={session}>
      <div className="mx-auto max-w-3xl space-y-8">
        <PageHeader
          title="검토 등록"
          description="프로젝트화 이전 검토·요청 사항을 등록합니다."
          breadcrumb={[{ label: "검토", href: "/reviews" }, { label: "검토 등록" }]}
        />
        {!configured ? <SupabaseConfigAlert /> : <ReviewForm mode="create" assignees={assignees} />}
      </div>
    </AppShell>
  );
}
