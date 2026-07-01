"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Pencil, MessageSquare, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { WeeklyWorkTypeBadge } from "@/components/weekly-work-type-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildUserDisplayMap, resolveUserDisplayLabel } from "@/lib/user-display";
import { buildUserAvatarMap } from "@/lib/user-avatars";
import { groupWeeklyWorkByAssignee } from "@/lib/weekly-work-sort";
import {
  getWeeklyWorkSummary,
  formatWeekRangeLabel,
  getFilledDailyEntries,
  getDayEntryPreview,
  countOvertimeDays,
} from "@/lib/weekly-work-utils";
import type { WeeklyWork } from "@/lib/weekly-work-types";
import type { UserPublic } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WeeklyWorkListViewProps {
  items: WeeklyWork[];
  assignees: UserPublic[];
  canWrite: boolean;
  currentUserId: string;
  isAdmin: boolean;
  unreadByWorkId?: Record<string, number>;
}

function MultilineText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return <span className={cn("whitespace-pre-wrap", className)}>{children}</span>;
}

function WeeklyWorkTable({
  items,
  canWrite,
  currentUserId,
  isAdmin,
  unreadByWorkId,
  onDelete,
  deletingId,
}: {
  items: WeeklyWork[];
  canWrite: boolean;
  currentUserId: string;
  isAdmin: boolean;
  unreadByWorkId: Record<string, number>;
  onDelete: (item: WeeklyWork) => void;
  deletingId: string | null;
}) {
  function canModifyItem(item: WeeklyWork) {
    if (!canWrite) return false;
    return isAdmin || item.user_id === currentUserId;
  }

  return (
    <div className="overflow-x-auto surface-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
            <TableHead className="w-24">구분</TableHead>
            <TableHead>내용</TableHead>
            <TableHead className="w-44">주간</TableHead>
            <TableHead className="w-32">코멘트</TableHead>
            {canWrite ? <TableHead className="w-28">관리</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const summary = getWeeklyWorkSummary(item);
            const filledDays = getFilledDailyEntries(item);
            const editable = canModifyItem(item);
            const isDeleting = deletingId === item.id;
            const unreadCount = unreadByWorkId[item.id] ?? 0;
            const canComment = isAdmin && item.user_id !== currentUserId;

            return (
              <TableRow key={item.id} className="hover:bg-slate-50/50">
                <TableCell>
                  <WeeklyWorkTypeBadge workType={item.work_type} />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/weekly-work/${item.id}`}
                    className="group block"
                  >
                    <div className="flex items-start gap-2">
                      {summary ? (
                        <MultilineText className="font-medium text-slate-900 group-hover:text-brand-navy">
                          {summary}
                        </MultilineText>
                      ) : (
                        <span className="font-medium text-slate-400">(내용 없음)</span>
                      )}
                      {unreadCount > 0 ? (
                        <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      ) : null}
                    </div>
                    {filledDays.length > 0 ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {filledDays.length}일 등록
                        {filledDays[0]
                          ? (
                              <>
                                {" · "}
                                {filledDays[0].label}:{" "}
                                <MultilineText>
                                  {getDayEntryPreview(filledDays[0])}
                                </MultilineText>
                              </>
                            )
                          : ""}
                        {countOvertimeDays(item) > 0
                          ? ` · 야근 ${countOvertimeDays(item)}일`
                          : ""}
                      </p>
                    ) : null}
                  </Link>
                  {item.work_type === "misc" &&
                  item.content &&
                  item.content.trim() !== summary.trim() ? (
                    <MultilineText className="mt-1 block text-xs text-slate-500">
                      {item.content}
                    </MultilineText>
                  ) : null}
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {formatWeekRangeLabel(item.week_start)}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/weekly-work/${item.id}`}
                    className="inline-flex items-center gap-1 text-sm text-brand-navy hover:underline"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {canComment ? "코멘트" : "보기"}
                  </Link>
                </TableCell>
                {canWrite ? (
                  <TableCell>
                    {editable ? (
                      <div className="flex gap-1">
                        <Link
                          href={`/weekly-work/${item.id}/edit`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                          aria-label="수정"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => onDelete(item)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function WeeklyWorkListView({
  items,
  assignees,
  canWrite,
  currentUserId,
  isAdmin,
  unreadByWorkId = {},
}: WeeklyWorkListViewProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const userMap = buildUserDisplayMap(assignees);
  const avatarMap = buildUserAvatarMap(assignees);
  const assigneeGroups = useMemo(
    () => groupWeeklyWorkByAssignee(items, userMap),
    [items, userMap],
  );

  async function handleDelete(item: WeeklyWork) {
    const summary = getWeeklyWorkSummary(item);
    const confirmed = window.confirm(
      `"${summary.replace(/\n/g, " ")}" 항목을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
    );
    if (!confirmed) return;

    setDeletingId(item.id);
    setError("");

    try {
      const response = await fetch(`/api/weekly-work/${item.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "삭제에 실패했습니다.");
        return;
      }

      router.refresh();
    } catch {
      setError("삭제 처리 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="surface-card py-16 text-center">
        <p className="text-sm font-medium text-slate-600">
          등록된 주간업무가 없습니다
        </p>
        <p className="mt-1 text-xs text-slate-400">
          프로젝트 업무와 잡무를 구분해 등록해 보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {assigneeGroups.map((group) => {
        const assignee = assignees.find((user) => user.id === group.userId);

        return (
          <section key={group.userId} className="space-y-3">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <UserAvatar
                userId={group.userId}
                name={assignee?.name ?? group.userLabel}
                avatarUrl={avatarMap[group.userId] ?? assignee?.avatarUrl ?? null}
                size="md"
              />
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {resolveUserDisplayLabel(userMap, group.userId)}
                </h3>
                <p className="text-xs text-slate-500">{group.items.length}건</p>
              </div>
            </div>

            <WeeklyWorkTable
              items={group.items}
              canWrite={canWrite}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              unreadByWorkId={unreadByWorkId}
              onDelete={(item) => void handleDelete(item)}
              deletingId={deletingId}
            />
          </section>
        );
      })}
    </div>
  );
}
