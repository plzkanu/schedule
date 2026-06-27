"use client";

import { FormEvent, useEffect, useState } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ISSUE_SEVERITIES,
  ISSUE_STATUSES,
  type ProjectIssue,
  type ProjectIssueInput,
  type IssueSeverity,
  type IssueStatus,
} from "@/lib/issue-types";
import type { UserPublic } from "@/lib/types";
import { formatUserDisplayLabel } from "@/lib/user-display";

interface IssueFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  projectId: string;
  issue?: ProjectIssue;
  assignees: UserPublic[];
  defaultReporterId?: string;
  onSuccess: () => Promise<void>;
}

function todayDateString() {
  return format(new Date(), "yyyy-MM-dd");
}

const EMPTY_FORM: ProjectIssueInput = {
  title: "",
  description: "",
  severity: "중",
  status: "신규",
  reporter_id: "",
  assignee_id: "",
  occurred_date: todayDateString(),
  resolution: "",
  notes: "",
};

export function IssueFormDialog({
  open,
  onOpenChange,
  mode,
  projectId,
  issue,
  assignees,
  defaultReporterId,
  onSuccess,
}: IssueFormDialogProps) {
  const [form, setForm] = useState<ProjectIssueInput>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && issue) {
      setForm({
        title: issue.title,
        description: issue.description ?? "",
        severity: issue.severity,
        status: issue.status,
        reporter_id: issue.reporter_id ?? "",
        assignee_id: issue.assignee_id ?? "",
        occurred_date: issue.occurred_date,
        resolution: issue.resolution ?? "",
        notes: issue.notes ?? "",
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        occurred_date: todayDateString(),
        reporter_id: defaultReporterId ?? "",
      });
    }
    setError("");
  }, [open, mode, issue, defaultReporterId]);

  function updateField<K extends keyof ProjectIssueInput>(
    key: K,
    value: ProjectIssueInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const url =
        mode === "create"
          ? `/api/projects/${projectId}/issues`
          : `/api/projects/${projectId}/issues/${issue!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }

      onOpenChange(false);
      await onSuccess();
    } catch {
      setError("저장 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!issue) {
      return;
    }

    const confirmed = window.confirm(
      `"${issue.title}" 이슈를 삭제하시겠습니까?`,
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/projects/${projectId}/issues/${issue.id}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "삭제에 실패했습니다.");
        return;
      }

      onOpenChange(false);
      await onSuccess();
    } catch {
      setError("삭제 처리 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "이슈 등록" : "이슈 수정"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="issue-title">제목</Label>
            <Input
              id="issue-title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="이슈 제목"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>심각도</Label>
              <Select
                value={form.severity}
                onValueChange={(v) => updateField("severity", v as IssueSeverity)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ISSUE_SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>상태</Label>
              <Select
                value={form.status}
                onValueChange={(v) => updateField("status", v as IssueStatus)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ISSUE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue-occurred">발생일</Label>
            <Input
              id="issue-occurred"
              type="date"
              value={form.occurred_date}
              onChange={(e) => updateField("occurred_date", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>등록자</Label>
              <Select
                value={form.reporter_id || "none"}
                onValueChange={(v) =>
                  updateField("reporter_id", v === "none" ? "" : v)
                }
              >
                <SelectTrigger><SelectValue placeholder="등록자" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">미지정</SelectItem>
                  {assignees.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {formatUserDisplayLabel(u.name, u.department)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>담당자</Label>
              <Select
                value={form.assignee_id || "none"}
                onValueChange={(v) =>
                  updateField("assignee_id", v === "none" ? "" : v)
                }
              >
                <SelectTrigger><SelectValue placeholder="담당자" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">미지정</SelectItem>
                  {assignees.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {formatUserDisplayLabel(u.name, u.department)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue-desc">내용</Label>
            <Textarea
              id="issue-desc"
              value={form.description ?? ""}
              onChange={(e) => updateField("description", e.target.value)}
              rows={4}
              placeholder="이슈 상황, 영향 범위, 재현 방법 등"
            />
          </div>

          {form.status === "해결" || mode === "edit" ? (
            <div className="space-y-2">
              <Label htmlFor="issue-resolution">해결 내용</Label>
              <Textarea
                id="issue-resolution"
                value={form.resolution ?? ""}
                onChange={(e) => updateField("resolution", e.target.value)}
                rows={3}
                placeholder="조치 내용, 원인, 후속 조치 등"
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="issue-notes">비고</Label>
            <Textarea
              id="issue-notes"
              value={form.notes ?? ""}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={2}
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:justify-between">
            {mode === "edit" ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "삭제 중..." : "삭제"}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || isDeleting}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="bg-brand-navy hover:bg-brand-navy-dark"
              >
                {isSubmitting ? "저장 중..." : "저장"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
