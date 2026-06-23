"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/reviews", label: "검토" },
  { href: "/projects", label: "프로젝트" },
  { href: "/tech-capabilities", label: "기술 확보" },
  { href: "/admin/users", label: "사용자" },
] as const;

interface AppMobileHeaderProps {
  showAdmin: boolean;
}

export function AppMobileHeader({ showAdmin }: AppMobileHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <BrandLogo className="origin-left scale-90" subtitle="" size="sm" />
        <LogoutButton variant="mobile" />
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
        {NAV_ITEMS.filter(
          (item) => item.href !== "/admin/users" || showAdmin,
        ).map((item) => {
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
      </nav>
    </header>
  );
}
