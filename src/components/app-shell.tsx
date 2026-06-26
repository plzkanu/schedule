import { AppMobileHeader } from "@/components/app-mobile-header";
import { AppSidebar } from "@/components/app-sidebar";
import { canManageUsers } from "@/lib/auth-permissions";
import type { SessionUser } from "@/lib/types";

interface AppShellProps {
  session: SessionUser;
  children: React.ReactNode;
}

export function AppShell({ session, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <AppSidebar session={session} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppMobileHeader
          showAdmin={canManageUsers(session)}
          session={session}
        />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
