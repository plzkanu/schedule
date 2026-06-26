"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, format, parseISO, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  WEEKLY_WORK_TYPES,
  WEEKLY_WORK_TYPE_LABELS,
} from "@/lib/weekly-work-types";
import { formatWeekRangeLabel, getWeekStart } from "@/lib/weekly-work-utils";
import { formatUserDisplayLabel } from "@/lib/user-display";
import type { UserPublic } from "@/lib/types";

interface WeeklyWorkFiltersProps {
  showUserFilter: boolean;
  assignees: UserPublic[];
}

export function WeeklyWorkFilters({
  showUserFilter,
  assignees,
}: WeeklyWorkFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const weekStart = searchParams.get("week_start") ?? getWeekStart();
  const workType = searchParams.get("work_type") ?? "";
  const userId = searchParams.get("user_id") ?? "";

  function updateParams(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    startTransition(() => {
      router.push(`/weekly-work?${params.toString()}`);
    });
  }

  function shiftWeek(direction: -1 | 1) {
    const base = parseISO(weekStart);
    const next =
      direction === -1 ? subDays(base, 7) : addDays(base, 7);
    updateParams((params) => {
      params.set("week_start", format(next, "yyyy-MM-dd"));
    });
  }

  return (
    <div className="surface-card flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <Label>조회 주간</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => shiftWeek(-1)}
            disabled={isPending}
            aria-label="이전 주"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[220px] rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
            {formatWeekRangeLabel(weekStart)}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => shiftWeek(1)}
            disabled={isPending}
            aria-label="다음 주"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() =>
              updateParams((params) => {
                params.set("week_start", getWeekStart());
              })
            }
          >
            이번 주
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Label>업무 구분</Label>
          <Select
            value={workType || "all"}
            onValueChange={(value) =>
              updateParams((params) => {
                if (!value || value === "all") params.delete("work_type");
                else params.set("work_type", value);
              })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {WEEKLY_WORK_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {WEEKLY_WORK_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showUserFilter ? (
          <div className="space-y-2">
            <Label>작성자</Label>
            <Select
              value={userId || "all"}
              onValueChange={(value) =>
                updateParams((params) => {
                  if (!value || value === "all") params.delete("user_id");
                  else params.set("user_id", value);
                })
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {assignees.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {formatUserDisplayLabel(user.name, user.department)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
    </div>
  );
}
