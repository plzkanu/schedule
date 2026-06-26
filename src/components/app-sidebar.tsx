"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  CalendarDays,
  Cpu,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { WeeklyWorkNotificationBadge } from "@/components/weekly-work-notification-badge";
import { ROLE_LABELS } from "@/lib/role-labels";
import { canManageUsers } from "@/lib/auth-permissions";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAIN_NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/reviews", label: "검토", icon: ClipboardList },
  { href: "/projects", label: "프로젝트", icon: FolderKanban },
  { href: "/tech-capabilities", label: "기술 확보", icon: Cpu },
] as const;

const WEEKLY_WORK_NAV_ITEM = {
  href: "/weekly-work",
  label: "주간업무",
  icon: CalendarDays,
} as const;

interface AppSidebarProps {
  session: SessionUser;
}

export function AppSidebar({ session }: AppSidebarProps) {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function navLinkClass(active: boolean) {
    return cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
      active
        ? "bg-white/15 text-white shadow-sm ring-1 ring-white/10"
        : "text-white/70 hover:bg-white/10 hover:text-white",
    );
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-brand-navy text-white lg:flex">
      <div className="border-b border-white/10 px-6 py-6">
        <BrandLogo variant="light" subtitle="IT 프로젝트 현황 · 일정관리" />
      </div>

      <div className="border-b border-white/10 px-4 py-4">
        <div className="rounded-xl bg-white/10 px-3 py-3 ring-1 ring-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-cyan text-sm font-semibold text-white">
              {session.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold">{session.name}</p>
                <WeeklyWorkNotificationBadge variant="sidebar" />
              </div>
              <p className="truncate text-xs text-white/60">
                {ROLE_LABELS[session.role]}
                {session.department ? ` · ${session.department}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            로그아웃
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {MAIN_NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={navLinkClass(active)}
            >
              <Icon className={cn("h-4 w-4", active && "text-brand-cyan")} />
              {item.label}
            </Link>
          );
        })}
        {canManageUsers(session) ? (
          <Link
            href="/admin/users"
            className={navLinkClass(isActive("/admin/users"))}
          >
            <Users
              className={cn(
                "h-4 w-4",
                isActive("/admin/users") && "text-brand-cyan",
              )}
            />
            사용자 관리
          </Link>
        ) : null}
        <div className="mt-3 border-t border-white/15 pt-3">
          <Link
            href={WEEKLY_WORK_NAV_ITEM.href}
            className={navLinkClass(isActive(WEEKLY_WORK_NAV_ITEM.href))}
          >
            <WEEKLY_WORK_NAV_ITEM.icon
              className={cn(
                "h-4 w-4",
                isActive(WEEKLY_WORK_NAV_ITEM.href) && "text-brand-cyan",
              )}
            />
            {WEEKLY_WORK_NAV_ITEM.label}
          </Link>
        </div>
      </nav>
    </aside>
  );
}
