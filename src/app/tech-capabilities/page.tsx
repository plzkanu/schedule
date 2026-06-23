import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { TechCapabilityFilters as TechFiltersBar } from "@/components/tech-capability-filters";
import { TechCapabilityListView } from "@/components/tech-capability-list-view";
import { TechStatsBar } from "@/components/tech-stats-bar";
import { buttonVariants } from "@/components/ui/button";
import { canWrite, getSessionUser } from "@/lib/auth";
import { listTechCapabilities } from "@/lib/tech-capabilities";
import type {
  TechCapability,
  TechCapabilityFilters,
  TechCategory,
  TechMaturity,
  TechPriority,
  TechStatus,
} from "@/lib/tech-capability-types";
import { TECH_MATURITIES } from "@/lib/tech-capability-types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllUsers } from "@/lib/users-store";
import { toPublicUser } from "@/lib/types";

interface TechCapabilitiesPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePageFilters(
  searchParams: TechCapabilitiesPageProps["searchParams"],
): TechCapabilityFilters {
  const filters: TechCapabilityFilters = {};

  const category = getParam(searchParams.category);
  if (category) {
    filters.category = category as TechCategory;
  }

  const maturity = getParam(searchParams.maturity);
  if (maturity) {
    filters.maturity = maturity as TechMaturity;
  }

  const status = getParam(searchParams.status);
  if (status) {
    filters.status = status as TechStatus;
  }

  const priority = getParam(searchParams.priority);
  if (priority) {
    filters.priority = priority as TechPriority;
  }

  const ownerId = getParam(searchParams.owner_id);
  if (ownerId) {
    filters.owner_id = ownerId;
  }

  const search = getParam(searchParams.search);
  if (search) {
    filters.search = search;
  }

  return filters;
}

function buildMaturityCounts(items: { maturity: TechMaturity }[]) {
  const counts = Object.fromEntries(
    TECH_MATURITIES.map((maturity) => [maturity, 0]),
  ) as Record<TechMaturity, number>;

  for (const item of items) {
    counts[item.maturity] += 1;
  }

  return counts;
}

export default async function TechCapabilitiesPage({
  searchParams,
}: TechCapabilitiesPageProps) {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  const configured = isSupabaseConfigured();
  const users = await getAllUsers();
  const assignees = users
    .filter((user) => user.role === "admin" || user.role === "member")
    .map(toPublicUser);
  const ownerNames = Object.fromEntries(users.map((user) => [user.id, user.name]));

  const filters = parsePageFilters(searchParams);

  const emptyResult = { data: [] as TechCapability[], error: null };

  const [{ data: allItems }, { data: items, error }] = configured
    ? await Promise.all([listTechCapabilities(), listTechCapabilities(filters)])
    : [emptyResult, emptyResult];

  const maturityCounts = buildMaturityCounts(allItems);

  return (
    <AppShell session={session}>
      <div className="space-y-6">
        <PageHeader
          title="기술 확보"
          description="AI·IT 기술 내재화 계획과 진행 현황을 관리합니다."
          action={
            canWrite(session) ? (
              <Link
                href="/tech-capabilities/new"
                className={buttonVariants({
                  className:
                    "bg-brand-navy hover:bg-brand-navy-dark shadow-sm",
                })}
              >
                + 새 기술 등록
              </Link>
            ) : undefined
          }
        />

        {!configured ? (
          <SupabaseConfigAlert />
        ) : (
          <>
            <Suspense fallback={<div className="h-14 rounded-xl bg-white" />}>
              <TechStatsBar counts={maturityCounts} total={allItems.length} />
            </Suspense>

            <Suspense fallback={<div className="h-20 rounded-xl bg-white" />}>
              <TechFiltersBar assignees={assignees} />
            </Suspense>

            {error ? (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            ) : null}

            <TechCapabilityListView items={items} ownerNames={ownerNames} />
          </>
        )}
      </div>
    </AppShell>
  );
}
