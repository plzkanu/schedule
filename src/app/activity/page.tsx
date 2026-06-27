import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ActivityLogList } from "@/components/activity-log-list";
import { ActivityPagination } from "@/components/activity-pagination";
import { PageHeader } from "@/components/page-header";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { listActivityLogsPaginated } from "@/lib/activity-logs";
import { getSessionUser } from "@/lib/auth";
import { listProjects } from "@/lib/projects";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllUsers } from "@/lib/users-store";
import { buildUserDisplayMap } from "@/lib/user-display";

const PAGE_SIZE = 20;

interface ActivityPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function getPage(searchParams: ActivityPageProps["searchParams"]) {
  const raw = Array.isArray(searchParams.page)
    ? searchParams.page[0]
    : searchParams.page;
  const page = Number(raw ?? 1);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default async function ActivityPage({ searchParams }: ActivityPageProps) {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  const configured = isSupabaseConfigured();
  const page = getPage(searchParams);

  if (!configured) {
    return (
      <AppShell session={session}>
        <SupabaseConfigAlert />
      </AppShell>
    );
  }

  const [
    { data: logs, total, error },
    { data: projects },
    users,
  ] = await Promise.all([
    listActivityLogsPaginated(page, PAGE_SIZE),
    listProjects(),
    getAllUsers(),
  ]);

  const userNames = buildUserDisplayMap(users);
  const projectNames = Object.fromEntries(
    (projects ?? []).map((project) => [project.id, project.name]),
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages && total > 0) {
    redirect(totalPages === 1 ? "/activity" : `/activity?page=${totalPages}`);
  }

  return (
    <AppShell session={session}>
      <div className="space-y-6">
        <PageHeader
          title="최근 활동"
          description="프로젝트·태스크 변경 이력을 페이지별로 조회합니다."
          breadcrumb={[
            { label: "대시보드", href: "/dashboard" },
            { label: "최근 활동" },
          ]}
        />

        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <div className="surface-card">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-sm text-slate-600">전체 {total}건</p>
          </div>
          <div className="p-5">
            <ActivityLogList
              logs={logs}
              userNames={userNames}
              projectNames={projectNames}
              emptyMessage="활동 이력이 없습니다."
            />
          </div>
          <ActivityPagination page={page} pageSize={PAGE_SIZE} total={total} />
        </div>
      </div>
    </AppShell>
  );
}
