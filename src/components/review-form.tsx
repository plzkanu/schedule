"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "@/lib/project-types";
import {
  REVIEW_CATEGORIES,
  REVIEW_PRIORITIES,
  REVIEW_STATUSES,
  type Review,
  type ReviewInput,
  type ReviewCategory,
  type ReviewPriority,
  type ReviewStatus,
} from "@/lib/review-types";
import type { UserPublic } from "@/lib/types";
import { formatUserDisplayLabel } from "@/lib/user-display";

interface ReviewFormProps {
  mode: "create" | "edit";
  item?: Review;
  assignees: UserPublic[];
  projects?: Project[];
}

function todayDateString() {
  return format(new Date(), "yyyy-MM-dd");
}

const EMPTY_FORM: ReviewInput = {
  title: "",
  description: "",
  category: "기타",
  status: "접수",
  priority: "중",
  request_department: "",
  requester_id: "",
  reviewer_id: "",
  requested_date: todayDateString(),
  target_date: "",
  review_summary: "",
  scope: "",
  notes: "",
  project_id: "",
};

export function ReviewForm({
  mode,
  item,
  assignees,
  projects = [],
}: ReviewFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ReviewInput>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && item) {
      setForm({
        title: item.title,
        description: item.description ?? "",
        category: item.category,
        status: item.status,
        priority: item.priority,
        request_department: item.request_department ?? "",
        requester_id: item.requester_id ?? "",
        reviewer_id: item.reviewer_id ?? "",
        requested_date: item.requested_date,
        target_date: item.target_date,
        review_summary: item.review_summary ?? "",
        scope: item.scope ?? "",
        notes: item.notes ?? "",
        project_id: item.project_id ?? "",
      });
    } else {
      setForm({ ...EMPTY_FORM, requested_date: todayDateString() });
    }
  }, [mode, item]);

  function updateField<K extends keyof ReviewInput>(key: K, value: ReviewInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const url = mode === "create" ? "/api/reviews" : `/api/reviews/${item!.id}`;
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

      router.push("/reviews");
      router.refresh();
    } catch {
      setError("저장 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-900">
          {mode === "create" ? "검토 등록" : "검토 수정"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          프로젝트화 이전 단계의 검토·요청 사항을 관리합니다.
        </p>
      </div>

      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Label htmlFor="review-title">검토 제목</Label>
          <Input
            id="review-title"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="예: ERP 모듈 개선 요청"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>분류</Label>
            <Select
              value={form.category}
              onValueChange={(v) => updateField("category", v as ReviewCategory)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REVIEW_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>상태</Label>
            <Select
              value={form.status}
              onValueChange={(v) => updateField("status", v as ReviewStatus)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REVIEW_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>우선순위</Label>
            <Select
              value={form.priority}
              onValueChange={(v) => updateField("priority", v as ReviewPriority)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REVIEW_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="review-requested">요청일</Label>
            <Input
              id="review-requested"
              type="date"
              value={form.requested_date}
              onChange={(e) => updateField("requested_date", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-target">검토 목표일</Label>
            <Input
              id="review-target"
              type="date"
              value={form.target_date}
              onChange={(e) => updateField("target_date", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="review-dept">요청 부서</Label>
            <Input
              id="review-dept"
              value={form.request_department ?? ""}
              onChange={(e) => updateField("request_department", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>검토 담당자</Label>
            <Select
              value={form.reviewer_id || "none"}
              onValueChange={(v) => updateField("reviewer_id", v === "none" ? "" : v)}
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
          <Label>요청자</Label>
          <Select
            value={form.requester_id || "none"}
            onValueChange={(v) => updateField("requester_id", v === "none" ? "" : v)}
          >
            <SelectTrigger><SelectValue placeholder="요청자" /></SelectTrigger>
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
          <Label htmlFor="review-desc">요청 개요</Label>
          <Textarea
            id="review-desc"
            value={form.description ?? ""}
            onChange={(e) => updateField("description", e.target.value)}
            rows={3}
            placeholder="요청 배경, 현황, 기대 효과"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-scope">검토 범위</Label>
          <Textarea
            id="review-scope"
            value={form.scope ?? ""}
            onChange={(e) => updateField("scope", e.target.value)}
            rows={3}
            placeholder="검토 대상 시스템, 업무, 제약 사항 등"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-summary">검토 의견</Label>
          <Textarea
            id="review-summary"
            value={form.review_summary ?? ""}
            onChange={(e) => updateField("review_summary", e.target.value)}
            rows={3}
            placeholder="검토 결과, 추진 방향, 리스크 등"
          />
        </div>

        {form.status === "프로젝트화" ? (
          <div className="space-y-2">
            <Label>연결 프로젝트</Label>
            <Select
              value={form.project_id || "none"}
              onValueChange={(v) => updateField("project_id", v === "none" ? "" : v)}
            >
              <SelectTrigger><SelectValue placeholder="프로젝트 선택" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">미연결</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="review-notes">비고</Label>
          <Textarea
            id="review-notes"
            value={form.notes ?? ""}
            onChange={(e) => updateField("notes", e.target.value)}
            rows={2}
          />
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-navy hover:bg-brand-navy-dark"
          >
            {isSubmitting ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </form>
  );
}
