"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
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
import { ProgressBar } from "@/components/progress-bar";
import { PROJECT_STATUSES } from "@/lib/project-types";
import {
  TECH_CATEGORIES,
  TECH_MATURITIES,
  TECH_PRIORITIES,
  type TechCapability,
  type TechCapabilityInput,
  type TechCategory,
  type TechMaturity,
  type TechPriority,
} from "@/lib/tech-capability-types";
import type { ProjectStatus } from "@/lib/project-types";
import type { UserPublic } from "@/lib/types";
import { formatUserDisplayLabel } from "@/lib/user-display";

interface TechCapabilityFormProps {
  mode: "create" | "edit";
  item?: TechCapability;
  assignees: UserPublic[];
}

const EMPTY_FORM: TechCapabilityInput = {
  name: "",
  description: "",
  category: "AI",
  maturity: "탐색",
  status: "계획",
  priority: "중",
  start_date: "",
  target_date: "",
  progress: 0,
  owner_id: "",
  department: "",
  use_cases: "",
  notes: "",
};

export function TechCapabilityForm({
  mode,
  item,
  assignees,
}: TechCapabilityFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<TechCapabilityInput>(() =>
    item
      ? {
          name: item.name,
          description: item.description ?? "",
          category: item.category,
          maturity: item.maturity,
          status: item.status,
          priority: item.priority,
          start_date: item.start_date,
          target_date: item.target_date,
          progress: item.progress,
          owner_id: item.owner_id ?? "",
          department: item.department ?? "",
          use_cases: item.use_cases ?? "",
          notes: item.notes ?? "",
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof TechCapabilityInput>(
    key: K,
    value: TechCapabilityInput[K],
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
          ? "/api/tech-capabilities"
          : `/api/tech-capabilities/${item!.id}`;
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

      router.push("/tech-capabilities");
      router.refresh();
    } catch {
      setError("저장 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="surface-card overflow-hidden"
    >
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-900">
          {mode === "create" ? "기술 확보 등록" : "기술 확보 수정"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          AI·IT 기술 내재화 현황과 목표를 관리합니다.
        </p>
      </div>

      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Label htmlFor="tech-name">기술명</Label>
          <Input
            id="tech-name"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="예: 사내 LLM 활용 플랫폼"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>기술 분야</Label>
            <Select
              value={form.category}
              onValueChange={(v) => updateField("category", v as TechCategory)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TECH_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>성숙도 단계</Label>
            <Select
              value={form.maturity}
              onValueChange={(v) => updateField("maturity", v as TechMaturity)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TECH_MATURITIES.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>상태</Label>
            <Select
              value={form.status}
              onValueChange={(v) => updateField("status", v as ProjectStatus)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>우선순위</Label>
            <Select
              value={form.priority}
              onValueChange={(v) => updateField("priority", v as TechPriority)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TECH_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tech-progress">진행률 (%)</Label>
            <Input
              id="tech-progress"
              type="number"
              min={0}
              max={100}
              value={form.progress}
              onChange={(e) => updateField("progress", Number(e.target.value))}
              required
            />
          </div>
        </div>

        <ProgressBar value={form.progress} showLabel />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tech-start">시작일</Label>
            <Input
              id="tech-start"
              type="date"
              value={form.start_date}
              onChange={(e) => updateField("start_date", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tech-target">내재화 목표일</Label>
            <Input
              id="tech-target"
              type="date"
              value={form.target_date}
              onChange={(e) => updateField("target_date", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>담당자</Label>
            <Select
              value={form.owner_id || "none"}
              onValueChange={(v) => updateField("owner_id", v === "none" ? "" : v)}
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
          <div className="space-y-2">
            <Label htmlFor="tech-dept">담당 부서</Label>
            <Input
              id="tech-dept"
              value={form.department ?? ""}
              onChange={(e) => updateField("department", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tech-desc">개요</Label>
          <Textarea
            id="tech-desc"
            value={form.description ?? ""}
            onChange={(e) => updateField("description", e.target.value)}
            rows={3}
            placeholder="기술 도입 배경과 목적"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tech-use">활용 분야</Label>
          <Textarea
            id="tech-use"
            value={form.use_cases ?? ""}
            onChange={(e) => updateField("use_cases", e.target.value)}
            rows={3}
            placeholder="적용 업무, 기대 효과, 파일럿 범위 등"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tech-notes">비고</Label>
          <Textarea
            id="tech-notes"
            value={form.notes ?? ""}
            onChange={(e) => updateField("notes", e.target.value)}
            rows={3}
          />
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
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
