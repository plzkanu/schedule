import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ReviewForm } from "@/components/review-form";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { canWrite, getSessionUser } from "@/lib/auth";
import { listProjects } from "@/lib/projects";
import { getReview } from "@/lib/reviews";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllUsers } from "@/lib/users-store";
import { toPublicUser } from "@/lib/types";

interface EditReviewPageProps {
  params: { id: string };
}

export default async function EditReviewPage({ params }: EditReviewPageProps) {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (!canWrite(session)) redirect("/dashboard");

  if (!isSupabaseConfigured()) {
    return (
      <AppShell session={session}>
        <SupabaseConfigAlert />
      </AppShell>
    );
  }

  const { data: item, error } = await getReview(params.id);

  if (error) {
    return (
      <AppShell session={session}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      </AppShell>
    );
  }

  if (!item) notFound();

  const users = await getAllUsers();
  const assignees = users
    .filter((user) => user.role === "admin" || user.role === "member")
    .map(toPublicUser);
  const { data: projects } = await listProjects();

  return (
    <AppShell session={session}>
      <div className="mx-auto max-w-3xl space-y-8">
        <PageHeader
          title="검토 수정"
          description={item.title}
          breadcrumb={[
            { label: "검토", href: "/reviews" },
            { label: item.title, href: `/reviews/${item.id}` },
            { label: "수정" },
          ]}
        />
        <ReviewForm
          mode="edit"
          item={item}
          assignees={assignees}
          projects={projects}
        />
      </div>
    </AppShell>
  );
}
