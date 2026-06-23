import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ReviewDetailView } from "@/components/review-detail-view";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { canWrite, getSessionUser } from "@/lib/auth";
import { getProject } from "@/lib/projects";
import { getReview } from "@/lib/reviews";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllUsers } from "@/lib/users-store";

interface ReviewDetailPageProps {
  params: { id: string };
}

export default async function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

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
  const userNames = Object.fromEntries(users.map((user) => [user.id, user.name]));

  let projectName: string | undefined;
  if (item.project_id) {
    const { data: project } = await getProject(item.project_id);
    projectName = project?.name;
  }

  return (
    <AppShell session={session}>
      <ReviewDetailView
        item={item}
        reviewerName={
          item.reviewer_id ? (userNames[item.reviewer_id] ?? item.reviewer_id) : "미지정"
        }
        requesterName={
          item.requester_id ? (userNames[item.requester_id] ?? item.requester_id) : "미지정"
        }
        projectName={projectName}
        canWrite={canWrite(session)}
      />
    </AppShell>
  );
}
