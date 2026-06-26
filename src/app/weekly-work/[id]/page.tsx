import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { WeeklyWorkCommentsPanel } from "@/components/weekly-work-comments-panel";
import { buttonVariants } from "@/components/ui/button";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllUsers } from "@/lib/users-store";
import { toPublicUser } from "@/lib/types";
import {
  canCommentWeeklyWork,
  canModifyWeeklyWork,
  canReplyWeeklyWork,
  canViewWeeklyWork,
} from "@/lib/weekly-work-access";
import { getWeeklyWork } from "@/lib/weekly-work";

interface WeeklyWorkDetailPageProps {
  params: { id: string };
}

export default async function WeeklyWorkDetailPage({
  params,
}: WeeklyWorkDetailPageProps) {
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

  if (!canViewWeeklyWork(session, item)) {
    redirect("/weekly-work");
  }

  const users = await getAllUsers();
  const assignees = users
    .filter((user) => user.role === "admin" || user.role === "member")
    .map(toPublicUser);

  const canComment = canCommentWeeklyWork(session, item);
  const canReply = canReplyWeeklyWork(session, item);
  const canEdit = canModifyWeeklyWork(session, item);

  return (
    <AppShell session={session}>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="주간업무 상세"
          description="관리자 코멘트와 담당자 응답(상태·코멘트)을 확인합니다."
          breadcrumb={[
            { label: "주간업무", href: "/weekly-work" },
            { label: "상세" },
          ]}
          action={
            canEdit ? (
              <Link
                href={`/weekly-work/${item.id}/edit`}
                className={buttonVariants({ variant: "outline" })}
              >
                수정
              </Link>
            ) : undefined
          }
        />

        <WeeklyWorkCommentsPanel
          item={item}
          assignees={assignees}
          canComment={canComment}
          canReply={canReply}
        />

        {isAdmin(session) && !canComment ? (
          <p className="text-sm text-slate-500">
            본인이 등록한 주간업무에는 코멘트를 남길 수 없습니다.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
