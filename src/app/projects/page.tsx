import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProjectFilters as ProjectFiltersBar } from "@/components/project-filters";
import { ProjectListView } from "@/components/project-list-view";
import { ProjectStatsBar } from "@/components/project-stats-bar";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { buttonVariants } from "@/components/ui/button";
import { canWrite, getSessionUser } from "@/lib/auth";
import { listProjects } from "@/lib/projects";
import type {
  Project,
  ProjectFilters,
  ProjectPriority,
  ProjectStatus,
} from "@/lib/project-types";
import { PROJECT_STATUSES } from "@/lib/project-types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllUsers } from "@/lib/users-store";
import { toPublicUser } from "@/lib/types";
import { buildUserDisplayMap } from "@/lib/user-display";
import { buildUserAvatarMap } from "@/lib/user-avatars";

interface ProjectsPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePageFilters(
  searchParams: ProjectsPageProps["searchParams"],
): ProjectFilters {
  const filters: ProjectFilters = {};

  const status = getParam(searchParams.status);
  if (status) {
    filters.status = status as ProjectStatus;
  }

  const priority = getParam(searchParams.priority);
  if (priority) {
    filters.priority = priority as ProjectPriority;
  }

  const ownerId = getParam(searchParams.owner_id);
  if (ownerId) {
    filters.owner_id = ownerId;
  }

  const progressMin = getParam(searchParams.progress_min);
  if (progressMin) {
    filters.progress_min = Number(progressMin);
  }

  const progressMax = getParam(searchParams.progress_max);
  if (progressMax) {
    filters.progress_max = Number(progressMax);
  }

  const search = getParam(searchParams.search);
  if (search) {
    filters.search = search;
  }

  return filters;
}

function buildStatusCounts(projects: { status: ProjectStatus }[]) {
  const counts = Object.fromEntries(
    PROJECT_STATUSES.map((status) => [status, 0]),
  ) as Record<ProjectStatus, number>;

  for (const project of projects) {
    counts[project.status] += 1;
  }

  return counts;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  const configured = isSupabaseConfigured();
  const users = await getAllUsers();
  const assignees = users
    .filter((user) => user.role === "admin" || user.role === "member")
    .map(toPublicUser);
  const ownerMap = buildUserDisplayMap(users);
  const avatarMap = buildUserAvatarMap(users);

  const filters = parsePageFilters(searchParams);

  const emptyResult = { data: [] as Project[], error: null };

  const [{ data: allProjects }, { data: projects, error }] = configured
    ? await Promise.all([listProjects(), listProjects(filters)])
    : [emptyResult, emptyResult];

  const statusCounts = buildStatusCounts(allProjects);

  return (
    <AppShell session={session}>
      <div className="space-y-6">
        <PageHeader
          title="프로젝트 관리"
          description="포트폴리오 전체를 검색·필터링하고 일정을 추적합니다."
          action={
            canWrite(session) ? (
              <Link
                href="/projects/new"
                className={buttonVariants({
                  className:
                    "bg-brand-navy hover:bg-brand-navy-dark shadow-sm",
                })}
              >
                + 새 프로젝트
              </Link>
            ) : undefined
          }
        />

        {!configured ? (
          <SupabaseConfigAlert />
        ) : (
          <>
            <Suspense fallback={<div className="h-14 rounded-xl bg-white" />}>
              <ProjectStatsBar
                counts={statusCounts}
                total={allProjects.length}
              />
            </Suspense>

            <Suspense fallback={<div className="h-20 rounded-xl bg-white" />}>
              <ProjectFiltersBar assignees={assignees} />
            </Suspense>

            {error ? (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            ) : null}

            <ProjectListView
              projects={projects}
              ownerMap={ownerMap}
              avatarMap={avatarMap}
              session={session}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}
