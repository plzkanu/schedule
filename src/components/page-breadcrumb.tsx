import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  variant?: "default" | "light";
}

export function PageBreadcrumb({
  items,
  className,
  variant = "default",
}: PageBreadcrumbProps) {
  const isLight = variant === "light";

  return (
    <nav
      aria-label="breadcrumb"
      className={cn("flex flex-wrap items-center gap-1 text-sm", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 ? (
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5",
                  isLight ? "text-white/40" : "text-slate-300",
                )}
              />
            ) : null}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className={cn(
                  "transition",
                  isLight
                    ? "text-white/65 hover:text-white"
                    : "text-slate-500 hover:text-brand-navy",
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  isLast
                    ? isLight
                      ? "font-medium text-white"
                      : "font-medium text-brand-navy"
                    : isLight
                      ? "text-white/65"
                      : "text-slate-500",
                )}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
