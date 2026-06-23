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
import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  type Project,
  type ProjectInput,
  type ProjectPriority,
  type ProjectStatus,
} from "@/lib/project-types";
import type { UserPublic } from "@/lib/types";
import { formatUserDisplayLabel } from "@/lib/user-display";

interface ProjectFormProps {
  mode: "create" | "edit";
  project?: Project;
  assignees: UserPublic[];
}

const EMPTY_FORM: ProjectInput = {
  name: "",
  description: "",
  status: "계획",
  priority: "중",
  start_date: "",
  end_date: "",
  progress: 0,
  owner_id: "",
  department: "",
};

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function ProjectForm({ mode, project, assignees }: ProjectFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProjectInput>(() =>
    project
      ? {
          name: project.name,
          description: project.description ?? "",
          status: project.status,
          priority: project.priority,
          start_date: project.start_date,
          end_date: project.end_date,
          progress: project.progress,
          owner_id: project.owner_id ?? "",
          department: project.department ?? "",
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof ProjectInput>(
    key: K,
    value: ProjectInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const url =
        mode === "create" ? "/api/projects" : `/api/projects/${project!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as {
        error?: string;
        project?: Project;
      };

      if (!response.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }

      router.push(`/projects/${data.project?.id ?? project!.id}`);
      router.refresh();
    } catch {
      setError("저장 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-900">
          {mode === "create" ? "프로젝트 정보 입력" : "프로젝트 정보 수정"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          기본 정보, 일정, 담당자를 입력해 주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 px-6 py-6">
        <FormSection title="기본 정보">
          <div className="space-y-2">
            <Label htmlFor="name">프로젝트명</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="예: 차세대 ERP 구축"
              className="border-slate-200 focus-visible:ring-brand-cyan"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={form.description ?? ""}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="프로젝트 목표 및 범위 (선택)"
              rows={4}
              className="border-slate-200 focus-visible:ring-brand-cyan"
            />
          </div>
        </FormSection>

        <FormSection title="상태 및 우선순위">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>상태</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  updateField("status", value as ProjectStatus)
                }
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>우선순위</Label>
              <Select
                value={form.priority}
                onValueChange={(value) =>
                  updateField("priority", value as ProjectPriority)
                }
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </FormSection>

        <FormSection title="일정 및 진행률" description="시작·종료일과 현재 진행률을 설정합니다.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">시작일</Label>
              <Input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={(event) =>
                  updateField("start_date", event.target.value)
                }
                className="border-slate-200"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">종료일</Label>
              <Input
                id="end_date"
                type="date"
                value={form.end_date}
                onChange={(event) =>
                  updateField("end_date", event.target.value)
                }
                className="border-slate-200"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="progress">진행률</Label>
              <span className="text-sm font-semibold text-brand-navy">
                {form.progress}%
              </span>
            </div>
            <Input
              id="progress"
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.progress}
              onChange={(event) =>
                updateField("progress", Number(event.target.value))
              }
              className="h-2 cursor-pointer accent-brand-cyan"
            />
            <ProgressBar value={form.progress} />
          </div>
        </FormSection>

        <FormSection title="담당 조직">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>담당자</Label>
              <Select
                value={form.owner_id || "none"}
                onValueChange={(value) =>
                  updateField("owner_id", value === "none" ? "" : value)
                }
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="담당자 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">미지정</SelectItem>
                  {assignees.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {formatUserDisplayLabel(user.name, user.department)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">부서</Label>
              <Input
                id="department"
                value={form.department ?? ""}
                onChange={(event) =>
                  updateField("department", event.target.value)
                }
                placeholder="담당 부서"
                className="border-slate-200"
              />
            </div>
          </div>
        </FormSection>

        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-navy hover:bg-brand-navy-dark shadow-sm"
          >
            {isSubmitting ? "저장 중..." : "저장"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="border-slate-200"
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
