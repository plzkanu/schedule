import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SupabaseConfigAlert } from "@/components/supabase-config-alert";
import { UserManagementPanel } from "@/components/user-management-panel";
import { canManageUsers, getSessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { toPublicUser, type User } from "@/lib/types";
import { getAllUsers } from "@/lib/users-store";

export default async function AdminUsersPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  if (!canManageUsers(session)) {
    redirect("/dashboard");
  }

  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <AppShell session={session}>
        <div className="space-y-8">
          <PageHeader
            title="사용자 관리"
            description="시스템 사용자를 등록·수정합니다."
          />
          <SupabaseConfigAlert />
        </div>
      </AppShell>
    );
  }

  let users: User[] = [];
  let loadError: string | null = null;

  try {
    users = await getAllUsers();
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "사용자 목록을 불러오지 못했습니다.";
    users = [];
  }

  return (
    <AppShell session={session}>
      <div className="space-y-8">
        <PageHeader
          title="사용자 관리"
          description="시스템 사용자를 등록·수정합니다. 관리자 역할(admin) 계정만 접근할 수 있습니다."
        />

        {loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
            <p className="font-semibold">사용자 데이터를 불러올 수 없습니다</p>
            <p className="mt-1">{loadError}</p>
            <p className="mt-2 text-xs text-red-700">
              Supabase SQL Editor에서{" "}
              <code className="rounded bg-red-100 px-1">005_it_users</code> 마이그레이션
              또는 <code className="rounded bg-red-100 px-1">apply-all-migrations.sql</code>
              을 실행했는지 확인하세요.
            </p>
          </div>
        ) : null}

        <UserManagementPanel
          initialUsers={users.map(toPublicUser)}
          currentUserId={session.id}
        />
      </div>
    </AppShell>
  );
}
