"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { AlertTriangle, Pencil } from "lucide-react";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { PriorityBadge } from "@/components/priority-badge";
import { ReviewCategoryBadge } from "@/components/review-category-badge";
import { ReviewStatusBadge } from "@/components/review-status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  calculateProjectDDay,
  formatDDayLabel,
  getDDayBadgeVariant,
} from "@/lib/dashboard";
import { isActiveReview } from "@/lib/review-sort";
import type { Review } from "@/lib/review-types";
import { cn } from "@/lib/utils";

interface ReviewDetailViewProps {
  item: Review;
  reviewerName: string;
  requesterName: string;
  projectName?: string;
  canWrite: boolean;
}

function formatDateLabel(value: string) {
  return format(new Date(`${value}T00:00:00`), "yyyy-MM-dd");
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1.5 text-sm text-slate-700">{children}</div>
    </div>
  );
}

export function ReviewDetailView({
  item,
  reviewerName,
  requesterName,
  projectName,
  canWrite,
}: ReviewDetailViewProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const dDay = calculateProjectDDay(item.target_date);
  const dDayVariant = getDDayBadgeVariant(dDay, "진행중");

  const DDAY_CLASS = {
    danger: "bg-red-500/20 text-red-100 ring-red-400/30",
    warning: "bg-amber-500/20 text-amber-100 ring-amber-400/30",
    default: "bg-white/15 text-white ring-white/20",
  } as const;

  async function handleDelete() {
    const confirmed = window.confirm(`"${item.title}" 검토 항목을 삭제하시겠습니까?`);
    if (!confirmed) return;

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/reviews/${item.id}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "삭제에 실패했습니다.");
        return;
      }
      router.push("/reviews");
      router.refresh();
    } catch {
      setError("삭제 처리 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-violet-900 text-white shadow-card">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#a78bfa55,_transparent_55%)]"
        />
        <div className="relative p-6 sm:p-8">
          <PageBreadcrumb
            variant="light"
            items={[{ label: "검토", href: "/reviews" }, { label: item.title }]}
            className="mb-5"
          />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <ReviewCategoryBadge category={item.category} />
                <ReviewStatusBadge status={item.status} />
                <PriorityBadge priority={item.priority} />
                {isActiveReview(item) ? (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
                      DDAY_CLASS[dDayVariant],
                    )}
                  >
                    {formatDDayLabel(dDay, "진행중")}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{item.title}</h1>
              {item.description ? (
                <p className="mt-2 max-w-2xl text-sm text-white/75">{item.description}</p>
              ) : null}
            </div>

            {canWrite ? (
              <Link
                href={`/reviews/${item.id}/edit`}
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white",
                })}
              >
                <Pencil className="mr-2 h-4 w-4" />
                수정
              </Link>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
              <p className="text-xs text-white/60">검토 담당</p>
              <p className="text-sm font-medium">{reviewerName}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
              <p className="text-xs text-white/60">요청</p>
              <p className="text-sm font-medium">
                {requesterName}
                {item.request_department ? ` · ${item.request_department}` : ""}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
              <p className="text-xs text-white/60">일정</p>
              <p className="text-sm font-medium">
                {formatDateLabel(item.requested_date)} ~ {formatDateLabel(item.target_date)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="surface-card p-6">
        <h2 className="text-sm font-semibold text-slate-800">검토 상세</h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <InfoBlock label="검토 범위">
            {item.scope ? (
              <p className="whitespace-pre-wrap">{item.scope}</p>
            ) : (
              <span className="text-slate-400">등록된 내용 없음</span>
            )}
          </InfoBlock>
          <InfoBlock label="검토 의견">
            {item.review_summary ? (
              <p className="whitespace-pre-wrap">{item.review_summary}</p>
            ) : (
              <span className="text-slate-400">등록된 내용 없음</span>
            )}
          </InfoBlock>
          <InfoBlock label="비고">
            {item.notes ? (
              <p className="whitespace-pre-wrap">{item.notes}</p>
            ) : (
              <span className="text-slate-400">등록된 내용 없음</span>
            )}
          </InfoBlock>
          <InfoBlock label="연결 프로젝트">
            {item.project_id && projectName ? (
              <Link
                href={`/projects/${item.project_id}`}
                className="font-medium text-brand-navy hover:text-brand-cyan hover:underline"
              >
                {projectName}
              </Link>
            ) : (
              <span className="text-slate-400">아직 프로젝트화되지 않음</span>
            )}
          </InfoBlock>
        </div>
      </div>

      {canWrite ? (
        <div className="rounded-xl border border-red-200/80 bg-red-50/50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-red-900">위험 구역</h3>
              <p className="mt-1 text-sm text-red-700/80">
                검토 항목을 삭제하면 관련 내역이 영구적으로 제거됩니다.
              </p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="mt-4"
              >
                {isDeleting ? "삭제 중..." : "검토 삭제"}
              </Button>
              {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
