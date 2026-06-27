import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActivityPaginationProps {
  page: number;
  pageSize: number;
  total: number;
}

export function ActivityPagination({
  page,
  pageSize,
  total,
}: ActivityPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) {
    return null;
  }

  function pageHref(nextPage: number) {
    return nextPage <= 1 ? "/activity" : `/activity?page=${nextPage}`;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((pageNumber) => {
      if (totalPages <= 7) {
        return true;
      }
      return (
        pageNumber === 1 ||
        pageNumber === totalPages ||
        Math.abs(pageNumber - page) <= 1
      );
    });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
      <p className="text-xs text-slate-500">
        전체 {total}건 · {page}/{totalPages}페이지
      </p>

      <div className="flex items-center gap-1">
        <Link
          href={pageHref(page - 1)}
          aria-disabled={page <= 1}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            page <= 1 && "pointer-events-none opacity-50",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          이전
        </Link>

        {pages.map((pageNumber, index) => {
          const prev = pages[index - 1];
          const showEllipsis = prev !== undefined && pageNumber - prev > 1;

          return (
            <span key={pageNumber} className="flex items-center gap-1">
              {showEllipsis ? (
                <span className="px-1 text-xs text-slate-400">…</span>
              ) : null}
              <Link
                href={pageHref(pageNumber)}
                className={cn(
                  buttonVariants({
                    variant: pageNumber === page ? "default" : "outline",
                    size: "sm",
                  }),
                  pageNumber === page && "bg-brand-navy hover:bg-brand-navy-dark",
                )}
              >
                {pageNumber}
              </Link>
            </span>
          );
        })}

        <Link
          href={pageHref(page + 1)}
          aria-disabled={page >= totalPages}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            page >= totalPages && "pointer-events-none opacity-50",
          )}
        >
          다음
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
