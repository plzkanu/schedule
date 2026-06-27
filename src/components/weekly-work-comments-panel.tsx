"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { MessageSquareReply } from "lucide-react";
import { formatCommentDate } from "@/components/weekly-work-notification-badge";
import { WeeklyWorkResponseStatusBadge } from "@/components/weekly-work-response-status-badge";
import { WeeklyWorkTypeBadge } from "@/components/weekly-work-type-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { buildUserDisplayMap, resolveUserDisplayLabel } from "@/lib/user-display";
import {
  WEEKLY_WORK_RESPONSE_STATUSES,
  WEEKLY_WORK_RESPONSE_STATUS_LABELS,
  buildCommentTree,
  isWeeklyWorkOwnerComment,
  type WeeklyWorkComment,
  type WeeklyWorkCommentNode,
  type WeeklyWorkResponseStatus,
} from "@/lib/weekly-work-comment-types";
import {
  formatWeekRangeLabel,
  getWeeklyWorkSummary,
  getFilledDailyEntries,
} from "@/lib/weekly-work-utils";
import type { WeeklyWork } from "@/lib/weekly-work-types";
import type { UserPublic } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WeeklyWorkCommentsPanelProps {
  item: WeeklyWork;
  assignees: UserPublic[];
  canComment: boolean;
  canReply: boolean;
}

interface ReplyFormProps {
  mode: "admin" | "owner";
  parentId: string;
  isSubmitting: boolean;
  onSubmit: (
    parentId: string,
    payload: { content: string; status?: WeeklyWorkResponseStatus },
  ) => Promise<boolean>;
  onCancel: () => void;
}

function ReplyForm({
  mode,
  parentId,
  isSubmitting,
  onSubmit,
  onCancel,
}: ReplyFormProps) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<WeeklyWorkResponseStatus>("review");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await onSubmit(parentId, {
      content,
      ...(mode === "owner" ? { status } : {}),
    });
    if (ok) {
      setContent("");
      setStatus("review");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-lg bg-white p-3 ring-1 ring-slate-200">
      {mode === "owner" ? (
        <div className="space-y-2">
          <Label className="text-xs">상태</Label>
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus((value ?? "review") as WeeklyWorkResponseStatus)
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKLY_WORK_RESPONSE_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {WEEKLY_WORK_RESPONSE_STATUS_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={mode === "owner" ? "답글을 입력하세요. (선택)" : "답글을 입력하세요."}
        rows={3}
        required={mode === "admin"}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          취소
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting}
          className="bg-brand-navy hover:bg-brand-navy-dark"
        >
          {isSubmitting ? "등록 중..." : "답글 등록"}
        </Button>
      </div>
    </form>
  );
}

interface CommentThreadItemProps {
  node: WeeklyWorkCommentNode;
  depth: number;
  workOwnerId: string;
  userMap: Record<string, string>;
  canComment: boolean;
  canReply: boolean;
  replyingToId: string | null;
  isSubmitting: boolean;
  onReplyClick: (commentId: string) => void;
  onReplyCancel: () => void;
  onReplySubmit: (
    parentId: string,
    payload: { content: string; status?: WeeklyWorkResponseStatus },
  ) => Promise<boolean>;
}

function CommentThreadItem({
  node,
  depth,
  workOwnerId,
  userMap,
  canComment,
  canReply,
  replyingToId,
  isSubmitting,
  onReplyClick,
  onReplyCancel,
  onReplySubmit,
}: CommentThreadItemProps) {
  const isOwnerComment = isWeeklyWorkOwnerComment(node, workOwnerId);
  const canReplyToThis = isOwnerComment ? canComment : canReply;
  const replyMode = isOwnerComment ? "admin" : "owner";

  return (
    <li
      className={cn(
        depth > 0 && "ml-3 border-l-2 border-slate-200 pl-4 sm:ml-4",
      )}
    >
      <article className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-800">
              {resolveUserDisplayLabel(userMap, node.author_id)}
            </p>
            {isOwnerComment ? (
              <>
                {node.status ? (
                  <WeeklyWorkResponseStatusBadge status={node.status} />
                ) : null}
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                  담당자
                </span>
              </>
            ) : (
              <span className="rounded-full bg-brand-navy/10 px-2 py-0.5 text-[10px] font-medium text-brand-navy">
                관리자
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{formatCommentDate(node.created_at)}</p>
        </div>

        {node.content.trim() ? (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {node.content}
          </p>
        ) : null}

        {canReplyToThis ? (
          <div className="mt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2 text-slate-600"
              onClick={() => onReplyClick(node.id)}
            >
              <MessageSquareReply className="h-3.5 w-3.5" />
              답글
            </Button>
          </div>
        ) : null}

        {replyingToId === node.id ? (
          <ReplyForm
            mode={replyMode}
            parentId={node.id}
            isSubmitting={isSubmitting}
            onSubmit={onReplySubmit}
            onCancel={onReplyCancel}
          />
        ) : null}
      </article>

      {node.replies.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {node.replies.map((reply) => (
            <CommentThreadItem
              key={reply.id}
              node={reply}
              depth={depth + 1}
              workOwnerId={workOwnerId}
              userMap={userMap}
              canComment={canComment}
              canReply={canReply}
              replyingToId={replyingToId}
              isSubmitting={isSubmitting}
              onReplyClick={onReplyClick}
              onReplyCancel={onReplyCancel}
              onReplySubmit={onReplySubmit}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function WeeklyWorkCommentsPanel({
  item,
  assignees,
  canComment,
  canReply,
}: WeeklyWorkCommentsPanelProps) {
  const router = useRouter();
  const [comments, setComments] = useState<WeeklyWorkComment[]>([]);
  const [newCommentContent, setNewCommentContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userMap = buildUserDisplayMap(assignees);

  const filledDays = getFilledDailyEntries(item);
  const commentTree = buildCommentTree(comments);

  async function loadComments() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/weekly-work/${item.id}/comments`);
      const data = (await response.json()) as {
        comments?: WeeklyWorkComment[];
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "코멘트를 불러오지 못했습니다.");
        return;
      }

      setComments(data.comments ?? []);
      router.refresh();
    } catch {
      setError("코멘트를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  async function postComment(
    payload: {
      content?: string;
      status?: WeeklyWorkResponseStatus;
      parent_id?: string | null;
    },
  ): Promise<boolean> {
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/weekly-work/${item.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "등록에 실패했습니다.");
        return false;
      }

      await loadComments();
      return true;
    } catch {
      setError("등록 처리 중 오류가 발생했습니다.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleNewCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await postComment({ content: newCommentContent, parent_id: null });
    if (ok) {
      setNewCommentContent("");
    }
  }

  async function handleReplySubmit(
    parentId: string,
    payload: { content: string; status?: WeeklyWorkResponseStatus },
  ) {
    const ok = await postComment({
      parent_id: parentId,
      content: payload.content,
      status: payload.status,
    });
    if (ok) {
      setReplyingToId(null);
    }
    return ok;
  }

  return (
    <div className="surface-card space-y-5 p-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <WeeklyWorkTypeBadge workType={item.work_type} />
          <span className="text-sm text-slate-500">
            {formatWeekRangeLabel(item.week_start)}
          </span>
        </div>
        <h2 className="mt-3 text-lg font-semibold text-slate-900">
          {getWeeklyWorkSummary(item)}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          작성자 {resolveUserDisplayLabel(userMap, item.user_id)}
        </p>
      </div>

      {filledDays.length > 0 ? (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="text-sm font-semibold text-slate-800">요일별 계획 · 실적</h3>
          <ul className="space-y-3">
            {filledDays.map((day) => (
              <li key={day.date} className="text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-700">{day.label}</span>
                  {day.overtime && day.actual.trim() ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
                      야근
                    </span>
                  ) : null}
                </div>
                {day.plan.trim() ? (
                  <p className="mt-1 leading-relaxed text-slate-600">
                    <span className="font-medium text-slate-500">계획</span>{" "}
                    {day.plan}
                  </p>
                ) : null}
                {day.actual.trim() ? (
                  <p className="mt-1 leading-relaxed text-slate-600">
                    <span className="font-medium text-slate-500">실적</span>{" "}
                    {day.actual}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">코멘트</h3>

        {isLoading ? (
          <p className="text-sm text-slate-500">코멘트를 불러오는 중...</p>
        ) : commentTree.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
            등록된 코멘트가 없습니다.
          </p>
        ) : (
          <ul className="space-y-4">
            {commentTree.map((node) => (
              <CommentThreadItem
                key={node.id}
                node={node}
                depth={0}
                workOwnerId={item.user_id}
                userMap={userMap}
                canComment={canComment}
                canReply={canReply}
                replyingToId={replyingToId}
                isSubmitting={isSubmitting}
                onReplyClick={setReplyingToId}
                onReplyCancel={() => setReplyingToId(null)}
                onReplySubmit={handleReplySubmit}
              />
            ))}
          </ul>
        )}
      </div>

      {canComment ? (
        <form
          onSubmit={handleNewCommentSubmit}
          className="space-y-3 border-t border-slate-100 pt-4"
        >
          <h3 className="text-sm font-semibold text-slate-800">새 코멘트</h3>
          <Textarea
            value={newCommentContent}
            onChange={(event) => setNewCommentContent(event.target.value)}
            placeholder="담당자에게 전달할 새 코멘트를 입력하세요."
            rows={4}
            required
          />
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-navy hover:bg-brand-navy-dark"
            >
              {isSubmitting ? "등록 중..." : "코멘트 등록"}
            </Button>
          </div>
        </form>
      ) : null}

      {!canComment && error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
