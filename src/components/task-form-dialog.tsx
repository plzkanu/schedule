"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
import { deleteTaskWithConfirm } from "@/lib/task-delete-client";
import { getChildTasks } from "@/lib/task-delete";
import {
  getChildCount,
  isGroupTask,
  listGroupTaskCandidates,
} from "@/lib/task-hierarchy";
import type { TaskInput, TaskWithDependencies } from "@/lib/task-types";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/project-types";
import type { UserPublic } from "@/lib/types";
import { formatUserDisplayLabel } from "@/lib/user-display";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  projectId: string;
  task?: TaskWithDependencies;
  tasks: TaskWithDependencies[];
  assignees: UserPublic[];
  defaultStartDate?: string;
  defaultEndDate?: string;
  onSuccess: (taskId?: string) => Promise<void>;
}

const EMPTY_FORM: TaskInput = {
  name: "",
  notes: "",
  assignee_id: "",
  start_date: "",
  end_date: "",
  status: "계획",
  progress: 0,
  is_group: false,
  parent_task_id: "",
  dependency_ids: [],
};

export function TaskFormDialog({
  open,
  onOpenChange,
  mode,
  projectId,
  task,
  tasks,
  assignees,
  defaultStartDate,
  defaultEndDate,
  onSuccess,
}: TaskFormDialogProps) {
  const [form, setForm] = useState<TaskInput>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const childCount = task ? getChildCount(tasks, task.id) : 0;
  const childTasks = task ? getChildTasks(tasks, task.id) : [];
  const isGroupLocked = childCount > 0;

  const groupCandidates = useMemo(
    () => listGroupTaskCandidates(tasks, task?.id),
    [tasks, task?.id],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && task) {
      setForm({
        name: task.name,
        notes: task.notes ?? "",
        assignee_id: task.assignee_id ?? "",
        start_date: task.start_date,
        end_date: task.end_date,
        status: task.status,
        progress: task.progress,
        is_group: isGroupTask(task, childCount),
        parent_task_id: task.parent_task_id ?? "",
        dependency_ids: task.dependency_ids,
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        start_date: defaultStartDate ?? "",
        end_date: defaultEndDate ?? "",
      });
    }
    setError("");
  }, [open, mode, task, defaultStartDate, defaultEndDate, childCount]);

  const dependencyCandidates = tasks.filter(
    (item) => item.id !== task?.id,
  );

  function updateField<K extends keyof TaskInput>(
    key: K,
    value: TaskInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleGroup(checked: boolean) {
    if (isGroupLocked && !checked) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      is_group: checked,
      parent_task_id: checked ? "" : prev.parent_task_id,
    }));
  }

  function toggleDependency(taskId: string, checked: boolean) {
    setForm((prev) => {
      const current = prev.dependency_ids ?? [];
      if (checked) {
        return { ...prev, dependency_ids: [...current, taskId] };
      }
      return {
        ...prev,
        dependency_ids: current.filter((id) => id !== taskId),
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const url =
        mode === "create"
          ? `/api/projects/${projectId}/tasks`
          : `/api/projects/${projectId}/tasks/${task!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as {
        error?: string;
        task?: { id: string };
      };

      if (!response.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }

      onOpenChange(false);
      await onSuccess(mode === "create" ? data.task?.id : undefined);
    } catch {
      setError("저장 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!task) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      const result = await deleteTaskWithConfirm(projectId, task.id, tasks);
      if (result.ok) {
        onOpenChange(false);
        await onSuccess();
        return;
      }

      if (result.error) {
        setError(result.error);
      }
    } catch {
      setError("삭제 처리 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  const isBusy = isSubmitting || isDeleting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "태스크 추가" : "태스크 수정"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-name">태스크명</Label>
            <Input
              id="task-name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-notes">비고</Label>
            <Textarea
              id="task-notes"
              value={form.notes ?? ""}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="관련 상세 내용, 참고 사항, 진행 메모 등을 입력하세요."
              rows={4}
              className="min-h-[96px] resize-y"
            />
            <p className="text-xs text-slate-400">
              {(form.notes ?? "").length}/2,000자
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-navy focus:ring-brand-cyan"
                checked={form.is_group ?? false}
                disabled={isGroupLocked}
                onChange={(event) => toggleGroup(event.target.checked)}
              />
              <span>
                <span className="block text-sm font-medium text-slate-800">
                  상위 태스크 (그룹)
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                  그룹으로 지정하면 하위 태스크를 묶어 관리할 수 있습니다.
                  {isGroupLocked ? (
                    <span className="mt-1 block text-amber-700">
                      하위 태스크가 {childCount}개 있어 그룹 설정을 해제할 수
                      없습니다.
                    </span>
                  ) : null}
                </span>
              </span>
            </label>
          </div>

          {mode === "edit" && childCount > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
              이 태스크를 삭제하면 하위 태스크 {childCount}개도 함께
              삭제됩니다.
              {childTasks.length > 0 ? (
                <span className="mt-1 block text-amber-700/90">
                  {childTasks
                    .slice(0, 3)
                    .map((child) => child.name)
                    .join(", ")}
                  {childTasks.length > 3
                    ? ` 외 ${childTasks.length - 3}개`
                    : ""}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-start">시작일</Label>
              <Input
                id="task-start"
                type="date"
                value={form.start_date}
                onChange={(event) =>
                  updateField("start_date", event.target.value)
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-end">종료일</Label>
              <Input
                id="task-end"
                type="date"
                value={form.end_date}
                onChange={(event) => updateField("end_date", event.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>상태</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  updateField("status", (value ?? "계획") as ProjectStatus)
                }
              >
                <SelectTrigger>
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
              <Label htmlFor="task-progress">진행률 (%)</Label>
              <Input
                id="task-progress"
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={(event) =>
                  updateField("progress", Number(event.target.value))
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>담당자</Label>
              <Select
                value={form.assignee_id || "none"}
                onValueChange={(value) =>
                  updateField("assignee_id", value === "none" ? "" : value ?? "")
                }
              >
                <SelectTrigger>
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
            {!form.is_group ? (
              <div className="space-y-2">
                <Label>소속 그룹</Label>
                <Select
                  value={form.parent_task_id || "none"}
                  onValueChange={(value) =>
                    updateField(
                      "parent_task_id",
                      value === "none" ? "" : value ?? "",
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="없음" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">없음 (최상위)</SelectItem>
                    {groupCandidates.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {groupCandidates.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    그룹 태스크가 없습니다. 상위 태스크로 등록하려면 그룹을
                    먼저 만들어 주세요.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {dependencyCandidates.length > 0 ? (
            <div className="space-y-2">
              <Label>선행 태스크 (의존 관계)</Label>
              <div className="max-h-32 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
                {dependencyCandidates.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={form.dependency_ids?.includes(item.id) ?? false}
                      onChange={(event) =>
                        toggleDependency(item.id, event.target.checked)
                      }
                    />
                    {item.name}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            {mode === "edit" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDelete()}
                disabled={isBusy}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "삭제 중..." : "태스크 삭제"}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isBusy}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isBusy}
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
