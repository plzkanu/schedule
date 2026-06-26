"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
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
import {
  WEEKLY_WORK_TYPES,
  WEEKLY_WORK_TYPE_LABELS,
  type WeeklyWork,
  type WeeklyWorkDayEntry,
  type WeeklyWorkInput,
  type WeeklyWorkType,
} from "@/lib/weekly-work-types";
import {
  buildEmptyDailyEntries,
  getWeekDays,
  getWeekStart,
  mergeDailyEntriesForWeek,
} from "@/lib/weekly-work-utils";
import { cn } from "@/lib/utils";

interface WeeklyWorkFormProps {
  mode: "create" | "edit";
  item?: WeeklyWork;
}

function createEmptyForm(): WeeklyWorkInput {
  const weekStart = getWeekStart();
  return {
    week_start: weekStart,
    work_type: "project",
    project_name: "",
    content: "",
    daily_entries: buildEmptyDailyEntries(weekStart),
  };
}

export function WeeklyWorkForm({ mode, item }: WeeklyWorkFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<WeeklyWorkInput>(createEmptyForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && item) {
      setForm({
        week_start: item.week_start,
        work_type: item.work_type,
        project_name: item.project_name ?? "",
        content: item.content ?? "",
        daily_entries: mergeDailyEntriesForWeek(
          item.week_start,
          item.daily_entries,
        ),
      });
    } else {
      setForm(createEmptyForm());
    }
  }, [mode, item]);

  const weekDays = getWeekDays(form.week_start);

  function updateField<K extends keyof WeeklyWorkInput>(
    key: K,
    value: WeeklyWorkInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleWeekStartChange(weekStart: string) {
    setForm((prev) => ({
      ...prev,
      week_start: weekStart,
      daily_entries: mergeDailyEntriesForWeek(weekStart, prev.daily_entries),
    }));
  }

  function handleWorkTypeChange(value: WeeklyWorkType) {
    setForm((prev) => ({
      ...prev,
      work_type: value,
      project_name: value === "project" ? prev.project_name : "",
      content: value === "misc" ? prev.content : "",
    }));
  }

  function getDayEntry(date: string): WeeklyWorkDayEntry {
    return form.daily_entries?.[date] ?? { plan: "", actual: "", overtime: false };
  }

  function updateDayEntry(
    date: string,
    patch: Partial<WeeklyWorkDayEntry>,
  ) {
    setForm((prev) => {
      const current = prev.daily_entries?.[date] ?? {
        plan: "",
        actual: "",
        overtime: false,
      };
      const next = { ...current, ...patch };

      if (!next.actual.trim()) {
        next.overtime = false;
      }

      return {
        ...prev,
        daily_entries: {
          ...prev.daily_entries,
          [date]: next,
        },
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const url =
        mode === "create" ? "/api/weekly-work" : `/api/weekly-work/${item!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const body: WeeklyWorkInput = {
        week_start: form.week_start,
        work_type: form.work_type,
        daily_entries: form.daily_entries,
        ...(form.work_type === "project"
          ? { project_name: form.project_name }
          : { content: form.content }),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }

      router.push("/weekly-work");
      router.refresh();
    } catch {
      setError("저장 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card w-full space-y-6 p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
        <div className="space-y-2">
          <Label htmlFor="week_start">주간 시작일 (월요일)</Label>
          <Input
            id="week_start"
            type="date"
            value={form.week_start}
            onChange={(event) => handleWeekStartChange(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>업무 구분</Label>
          <Select
            value={form.work_type}
            onValueChange={(value) =>
              handleWorkTypeChange((value ?? "project") as WeeklyWorkType)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKLY_WORK_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {WEEKLY_WORK_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {form.work_type === "project" ? (
        <div className="space-y-2">
          <Label htmlFor="project_name">프로젝트명</Label>
          <Input
            id="project_name"
            value={form.project_name ?? ""}
            onChange={(event) => updateField("project_name", event.target.value)}
            placeholder="예: ERP 고도화, 인프라 마이그레이션"
            required
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="content">업무 개요</Label>
          <Input
            id="content"
            value={form.content ?? ""}
            onChange={(event) => updateField("content", event.target.value)}
            placeholder="예: PC 교체 지원, 회의실 AV 점검"
          />
          <p className="text-xs text-slate-500">
            잡무의 전체 개요를 간단히 입력합니다. 요일별 계획·실적은 아래에
            작성하세요.
          </p>
        </div>
      )}

      <div className="space-y-4 border-t border-slate-100 pt-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">요일별 계획 · 실적</h3>
          <p className="mt-1 text-xs text-slate-500">
            각 날짜별로 계획과 실적을 입력하세요. 실적 입력 시 야근 진행 여부를
            선택할 수 있습니다. 최소 1일 이상 작성해야 합니다.
          </p>
        </div>

        <div className="space-y-4">
          {weekDays.map((day) => {
            const entry = getDayEntry(day.date);

            return (
              <div
                key={day.date}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
              >
                <p className="mb-3 text-sm font-semibold text-slate-800">
                  {day.label}
                </p>

                <div className="grid w-full gap-4 xl:grid-cols-2">
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor={`plan-${day.date}`} className="text-slate-700">
                      계획
                    </Label>
                    <Textarea
                      id={`plan-${day.date}`}
                      className="min-h-24 w-full"
                      value={entry.plan}
                      onChange={(event) =>
                        updateDayEntry(day.date, { plan: event.target.value })
                      }
                      placeholder="해당 날짜 계획 업무"
                      rows={4}
                    />
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor={`actual-${day.date}`} className="text-slate-700">
                      실적
                    </Label>
                    <Textarea
                      id={`actual-${day.date}`}
                      className="min-h-24 w-full"
                      value={entry.actual}
                      onChange={(event) =>
                        updateDayEntry(day.date, { actual: event.target.value })
                      }
                      placeholder="해당 날짜 수행 업무"
                      rows={4}
                    />
                    <label
                      className={cn(
                        "flex items-center gap-2 text-sm text-slate-600",
                        !entry.actual.trim() && "opacity-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={entry.overtime}
                        disabled={!entry.actual.trim()}
                        onChange={(event) =>
                          updateDayEntry(day.date, {
                            overtime: event.target.checked,
                          })
                        }
                      />
                      야근 진행
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/weekly-work")}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-navy hover:bg-brand-navy-dark"
        >
          {isSubmitting ? "저장 중..." : mode === "create" ? "등록" : "저장"}
        </Button>
      </div>
    </form>
  );
}
