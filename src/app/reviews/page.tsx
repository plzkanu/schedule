import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ReviewFilters } from "@/components/review-filters";
import { ReviewListView } from "@/components/review-list-view";
import { ReviewStatsBar } from "@/components/review-stats-bar";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { buttonVariants } from "@/components/ui/button";
import { canWrite, getSessionUser } from "@/lib/auth";
import { listReviews } from "@/lib/reviews";
import { isActiveReview } from "@/lib/review-sort";
import type {
  Review,
  ReviewFilters as ReviewFiltersType,
  ReviewCategory,
  ReviewPriority,
  ReviewStatus,
} from "@/lib/review-types";
import { REVIEW_STATUSES } from "@/lib/review-types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllUsers } from "@/lib/users-store";
import { toPublicUser } from "@/lib/types";
import { buildUserDisplayMap } from "@/lib/user-display";

interface ReviewsPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePageFilters(searchParams: ReviewsPageProps["searchParams"]): ReviewFiltersType {
  const filters: ReviewFiltersType = {};
  const category = getParam(searchParams.category);
  if (category) filters.category = category as ReviewCategory;
  const status = getParam(searchParams.status);
  if (status) filters.status = status as ReviewStatus;
  const priority = getParam(searchParams.priority);
  if (priority) filters.priority = priority as ReviewPriority;
  const reviewerId = getParam(searchParams.reviewer_id);
  if (reviewerId) filters.reviewer_id = reviewerId;
  const search = getParam(searchParams.search);
  if (search) filters.search = search;
  return filters;
}

function buildStatusCounts(items: { status: ReviewStatus }[]) {
  const counts = Object.fromEntries(
    REVIEW_STATUSES.map((status) => [status, 0]),
  ) as Record<ReviewStatus, number>;
  for (const item of items) counts[item.status] += 1;
  return counts;
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const configured = isSupabaseConfigured();
  const users = await getAllUsers();
  const assignees = users
    .filter((user) => user.role === "admin" || user.role === "member")
    .map(toPublicUser);
  const userNames = buildUserDisplayMap(users);

  const filters = parsePageFilters(searchParams);
  const emptyResult = { data: [] as Review[], error: null };

  const [{ data: allItems }, { data: items, error }] = configured
    ? await Promise.all([listReviews(), listReviews(filters)])
    : [emptyResult, emptyResult];

  const statusCounts = buildStatusCounts(allItems);
  const activeCount = allItems.filter(isActiveReview).length;

  return (
    <AppShell session={session}>
      <div className="space-y-6">
        <PageHeader
          title="검토"
          description="프로젝트화 이전 단계의 요청·검토 현황을 관리합니다."
          action={
            canWrite(session) ? (
              <Link
                href="/reviews/new"
                className={buttonVariants({
                  className: "bg-brand-navy hover:bg-brand-navy-dark shadow-sm",
                })}
              >
                + 검토 등록
              </Link>
            ) : undefined
          }
        />

        {!configured ? (
          <SupabaseConfigAlert />
        ) : (
          <>
            <Suspense fallback={<div className="h-14 rounded-xl bg-white" />}>
              <ReviewStatsBar
                counts={statusCounts}
                total={allItems.length}
                activeCount={activeCount}
              />
            </Suspense>

            <Suspense fallback={<div className="h-20 rounded-xl bg-white" />}>
              <ReviewFilters assignees={assignees} />
            </Suspense>

            {error ? (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            ) : null}

            <ReviewListView items={items} userNames={userNames} />
          </>
        )}
      </div>
    </AppShell>
  );
}
