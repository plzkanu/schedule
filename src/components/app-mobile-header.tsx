"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { LogoutButton } from "@/components/logout-button";
import { WeeklyWorkNotificationBadge } from "@/components/weekly-work-notification-badge";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAIN_NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/reviews", label: "검토" },
  { href: "/projects", label: "프로젝트" },
  { href: "/tech-capabilities", label: "기술 확보" },
] as const;

const ADMIN_NAV_ITEM = { href: "/admin/users", label: "사용자" } as const;

const WEEKLY_WORK_NAV_ITEM = {
  href: "/weekly-work",
  label: "주간업무",
} as const;

interface AppMobileHeaderProps {
  showAdmin: boolean;
  session: SessionUser;
}

export function AppMobileHeader({ showAdmin, session }: AppMobileHeaderProps) {
  const pathname = usePathname();

  const mainItems = [
    ...MAIN_NAV_ITEMS,
    ...(showAdmin ? [ADMIN_NAV_ITEM] : []),
  ];

  const weeklyWorkActive =
    pathname === WEEKLY_WORK_NAV_ITEM.href ||
    pathname.startsWith(`${WEEKLY_WORK_NAV_ITEM.href}/`);

  return (
    <header className="border-b border-slate-200 bg-white lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <BrandLogo className="origin-left scale-90" subtitle="" size="sm" />
        <div className="flex items-center gap-3">
          <WeeklyWorkNotificationBadge variant="inline" />
          <span className="hidden text-xs text-slate-500 sm:inline">{session.name}</span>
          <LogoutButton variant="mobile" />
        </div>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto px-3 pb-3">
        {mainItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition",
                active
                  ? "bg-brand-navy text-white"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              {item.label}
            </Link>
          );
        })}
        <div
          className="mx-1 h-6 w-px shrink-0 bg-slate-200"
          aria-hidden
        />
        <Link
          href={WEEKLY_WORK_NAV_ITEM.href}
          className={cn(
            "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition",
            weeklyWorkActive
              ? "bg-brand-navy text-white"
              : "bg-slate-100 text-slate-600",
          )}
        >
          {WEEKLY_WORK_NAV_ITEM.label}
        </Link>
      </nav>
    </header>
  );
}
