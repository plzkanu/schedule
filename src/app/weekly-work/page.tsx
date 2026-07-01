import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { WeeklyWorkFilters } from "@/components/weekly-work-filters";
import { WeeklyWorkListView } from "@/components/weekly-work-list-view";
import { UserScheduleCalendar } from "@/components/user-schedule-calendar";
import { buttonVariants } from "@/components/ui/button";
import { canWrite, getSessionUser, isAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllUsers } from "@/lib/users-store";
import { toPublicUser } from "@/lib/types";
import { scopeWeeklyWorkFilters } from "@/lib/weekly-work-access";
import { getUnreadWeeklyWorkSummaries } from "@/lib/weekly-work-comments";
import { listWeeklyWork } from "@/lib/weekly-work";
import type {
  WeeklyWork,
  WeeklyWorkFilters as WeeklyWorkFiltersType,
  WeeklyWorkType,
} from "@/lib/weekly-work-types";
import { getWeekStart } from "@/lib/weekly-work-utils";

interface WeeklyWorkPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePageFilters(
  searchParams: WeeklyWorkPageProps["searchParams"],
): WeeklyWorkFiltersType {
  const filters: WeeklyWorkFiltersType = {};
  filters.week_start = getParam(searchParams.week_start) ?? getWeekStart();

  const workType = getParam(searchParams.work_type);
  if (workType) {
    filters.work_type = workType as WeeklyWorkType;
  }

  const userId = getParam(searchParams.user_id);
  if (userId) {
    filters.user_id = userId;
  }

  return filters;
}

export default async function WeeklyWorkPage({
  searchParams,
}: WeeklyWorkPageProps) {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  const configured = isSupabaseConfigured();
  const users = await getAllUsers();
  const assignees = users
    .filter((user) => user.role === "admin" || user.role === "member")
    .map(toPublicUser);

  const filters = scopeWeeklyWorkFilters(session, parsePageFilters(searchParams));
  const emptyResult = { data: [] as WeeklyWork[], error: null };

  const { data: items, error } = configured
    ? await listWeeklyWork(filters)
    : emptyResult;

  const { data: unreadSummaries } = configured
    ? await getUnreadWeeklyWorkSummaries(session)
    : { data: [] };

  const unreadByWorkId = Object.fromEntries(
    (unreadSummaries ?? []).map((summary) => [
      summary.weekly_work_id,
      summary.unread_count,
    ]),
  );

  const admin = isAdmin(session);

  return (
    <AppShell session={session}>
      <div className="space-y-6">
        <PageHeader
          title="주간업무"
          description="IT팀 주간업무와 외근·휴가 일정을 등록·조회합니다."
          action={
            canWrite(session) ? (
              <Link
                href="/weekly-work/new"
                className={buttonVariants({
                  className: "bg-brand-navy hover:bg-brand-navy-dark shadow-sm",
                })}
              >
                + 주간업무 등록
              </Link>
            ) : undefined
          }
        />

        {!configured ? (
          <SupabaseConfigAlert />
        ) : (
          <>
            <UserScheduleCalendar
              canWrite={canWrite(session)}
              showUserFilter
              assignees={assignees}
              defaultUserId={session.id}
              currentUserId={session.id}
              title="외근 · 휴가 일정"
            />

            <Suspense fallback={<div className="h-24 rounded-xl bg-white" />}>
              <WeeklyWorkFilters
                showUserFilter={admin}
                assignees={assignees}
              />
            </Suspense>

            {error ? (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            ) : null}

            <WeeklyWorkListView
              items={items}
              assignees={assignees}
              canWrite={canWrite(session)}
              currentUserId={session.id}
              isAdmin={admin}
              unreadByWorkId={unreadByWorkId}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}
