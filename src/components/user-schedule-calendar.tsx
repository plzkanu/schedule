"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatUserDisplayLabel } from "@/lib/user-display";
import {
  getUserScheduleBadgeStyle,
  resolveScheduleColorMap,
} from "@/lib/user-schedule-colors";
import { UserScheduleTeamLegend } from "@/components/user-schedule-team-legend";
import {
  USER_SCHEDULE_ENTRY_LABELS,
  USER_SCHEDULE_ENTRY_SHORT_LABELS,
  USER_SCHEDULE_ENTRY_TYPES,
  type UserScheduleEntry,
  type UserScheduleEntryType,
} from "@/lib/user-schedule-types";
import type { UserPublic } from "@/lib/types";
import { cn } from "@/lib/utils";

interface UserScheduleCalendarProps {
  canWrite: boolean;
  showUserFilter?: boolean;
  assignees?: UserPublic[];
  defaultUserId: string;
  currentUserId: string;
  compact?: boolean;
  fillHeight?: boolean;
  title?: string;
}

const WEEK_STARTS_ON = 0 as const;
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const ALL_USERS = "all";

type ScheduleDialogMode = "create" | "edit" | "view";

const TYPE_LEGEND_STYLES: Record<UserScheduleEntryType, string> = {
  business_trip: "bg-sky-100 text-sky-800 ring-sky-200",
  vacation: "bg-amber-100 text-amber-800 ring-amber-200",
};

export function UserScheduleCalendar({
  canWrite,
  showUserFilter = false,
  assignees = [],
  defaultUserId,
  currentUserId,
  compact = false,
  fillHeight = false,
  title = "외근 · 휴가 일정",
}: UserScheduleCalendarProps) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selectedUserId, setSelectedUserId] = useState(
    showUserFilter ? ALL_USERS : defaultUserId,
  );
  const [entries, setEntries] = useState<UserScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<ScheduleDialogMode>("create");
  const [viewingEntry, setViewingEntry] = useState<UserScheduleEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [entryType, setEntryType] = useState<UserScheduleEntryType>("business_trip");
  const [note, setNote] = useState("");
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const [isSavingColor, setIsSavingColor] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth() + 1;
  const canRegisterOnDay =
    canWrite &&
    (!showUserFilter ||
      selectedUserId === ALL_USERS ||
      selectedUserId === currentUserId);

  const assigneeIds = useMemo(
    () => assignees.map((user) => user.id),
    [assignees],
  );

  const resolvedColorMap = useMemo(
    () => resolveScheduleColorMap(assigneeIds, colorMap),
    [assigneeIds, colorMap],
  );

  const userNameMap = useMemo(
    () => Object.fromEntries(assignees.map((user) => [user.id, user.name])),
    [assignees],
  );

  const userDisplayMap = useMemo(
    () =>
      Object.fromEntries(
        assignees.map((user) => [
          user.id,
          formatUserDisplayLabel(user.name, user.department),
        ]),
      ),
    [assignees],
  );

  const loadColors = useCallback(async () => {
    if (assigneeIds.length === 0) {
      return;
    }

    try {
      const response = await fetch("/api/user-schedule/colors");
      const data = (await response.json()) as {
        colors?: Record<string, string>;
        error?: string;
      };

      if (response.ok) {
        setColorMap(data.colors ?? {});
      }
    } catch {
      // 기본 색상으로 표시
    }
  }, [assigneeIds.length]);

  useEffect(() => {
    void loadColors();
  }, [loadColors]);

  async function handleColorChange(userId: string, color: string) {
    setColorMap((prev) => ({ ...prev, [userId]: color }));
    setIsSavingColor(true);

    try {
      const response = await fetch("/api/user-schedule/colors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, color }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "색상 저장에 실패했습니다.");
        await loadColors();
      }
    } catch {
      setError("색상 저장 중 오류가 발생했습니다.");
      await loadColors();
    } finally {
      setIsSavingColor(false);
    }
  }

  const filteredEntries = useMemo(() => {
    if (!showUserFilter || selectedUserId === ALL_USERS) {
      return entries;
    }
    return entries.filter((entry) => entry.user_id === selectedUserId);
  }, [entries, selectedUserId, showUserFilter]);

  const entriesByDate = useMemo(() => {
    const map: Record<string, UserScheduleEntry[]> = {};
    for (const entry of filteredEntries) {
      if (!map[entry.schedule_date]) {
        map[entry.schedule_date] = [];
      }
      map[entry.schedule_date].push(entry);
    }
    return map;
  }, [filteredEntries]);

  const ownEntryMap = useMemo(
    () =>
      Object.fromEntries(
        entries
          .filter((entry) => entry.user_id === currentUserId)
          .map((entry) => [entry.schedule_date, entry]),
      ),
    [entries, currentUserId],
  );

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON }),
      end: endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON }),
    });
  }, [cursor]);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        year: String(year),
        month: String(month),
      });
      if (showUserFilter && selectedUserId && selectedUserId !== ALL_USERS) {
        params.set("user_id", selectedUserId);
      }

      const response = await fetch(`/api/user-schedule?${params.toString()}`);
      const data = (await response.json()) as {
        items?: UserScheduleEntry[];
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "일정을 불러오지 못했습니다.");
        return;
      }

      setEntries(data.items ?? []);
    } catch {
      setError("일정을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [year, month, selectedUserId, showUserFilter]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  function openCreateDialog(date: string) {
    setViewingEntry(null);
    setDialogMode("create");
    setSelectedDate(date);
    setEndDate(date);
    setEntryType("business_trip");
    setNote("");
    setError("");
    setDialogOpen(true);
  }

  function openEntryDialog(entry: UserScheduleEntry) {
    const isOwnEntry = entry.user_id === currentUserId;
    setViewingEntry(entry);
    setDialogMode(isOwnEntry && canWrite ? "edit" : "view");
    setSelectedDate(entry.schedule_date);
    setEndDate(entry.schedule_date);
    setEntryType(entry.entry_type);
    setNote(entry.note ?? "");
    setError("");
    setDialogOpen(true);
  }

  function handleDayClick(date: string) {
    const ownEntry = ownEntryMap[date];
    if (ownEntry) {
      openEntryDialog(ownEntry);
      return;
    }

    if (canRegisterOnDay) {
      openCreateDialog(date);
    }
  }

  async function handleSave() {
    if (!selectedDate || !endDate) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/user-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_date: selectedDate,
          schedule_end_date: endDate !== selectedDate ? endDate : undefined,
          entry_type: entryType,
          note,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "등록에 실패했습니다.");
        return;
      }

      setDialogOpen(false);
      await loadEntries();
    } catch {
      setError("등록 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    const existing =
      viewingEntry ??
      (selectedDate ? ownEntryMap[selectedDate] : null);
    if (!existing) {
      setDialogOpen(false);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/user-schedule/${existing.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "삭제에 실패했습니다.");
        return;
      }

      setDialogOpen(false);
      await loadEntries();
    } catch {
      setError("삭제 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={cn(
        "surface-card w-full p-5 sm:p-6",
        fillHeight && "flex h-full min-h-0 flex-col",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showUserFilter && assignees.length > 0 ? (
            <Select
              value={selectedUserId}
              onValueChange={(value) => setSelectedUserId(value ?? defaultUserId)}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_USERS}>전체 (팀 공유)</SelectItem>
                {assignees.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {formatUserDisplayLabel(user.name, user.department)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <div className="flex items-center rounded-lg border border-slate-200 bg-white">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setCursor((prev) => addMonths(prev, -1))}
              aria-label="이전 달"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-28 px-2 text-center text-sm font-semibold text-slate-800">
              {format(cursor, "yyyy년 M월", { locale: ko })}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setCursor((prev) => addMonths(prev, 1))}
              aria-label="다음 달"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
        {USER_SCHEDULE_ENTRY_TYPES.map((type) => (
          <span key={type} className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-[10px] font-semibold ring-1 ring-inset",
                TYPE_LEGEND_STYLES[type],
              )}
            >
              {USER_SCHEDULE_ENTRY_SHORT_LABELS[type]}
            </span>
            {USER_SCHEDULE_ENTRY_LABELS[type]}
          </span>
        ))}
      </div>

      {assignees.length > 0 ? (
        <UserScheduleTeamLegend
          assignees={assignees}
          colorMap={resolvedColorMap}
          canEditColors={canWrite && !isSavingColor}
          compact={compact}
          onColorChange={(userId, color) => void handleColorChange(userId, color)}
        />
      ) : null}

      {error && !dialogOpen ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div
        className={cn(
          "mt-4",
          fillHeight && "flex min-h-0 flex-1 flex-col",
          compact && !fillHeight ? "overflow-hidden" : "",
          !fillHeight && !compact ? "overflow-x-auto" : "",
          !fillHeight && compact ? "overflow-hidden" : "",
        )}
      >
        <div
          className={cn(
            fillHeight ? "flex min-h-0 flex-1 flex-col" : compact ? "w-full min-w-0" : "min-w-[640px]",
          )}
        >
          <div className="grid shrink-0 grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((label, index) => (
              <div
                key={`${label}-${index}`}
                className="py-2 text-center text-xs font-medium text-slate-500"
              >
                {label}
              </div>
            ))}
          </div>

          <div
            className={cn(
              "mt-1 grid grid-cols-7 gap-1",
              fillHeight && "min-h-0 flex-1 auto-rows-fr",
            )}
          >
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayEntries = entriesByDate[dateKey] ?? [];
              const inMonth = isSameMonth(day, cursor);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={dateKey}
                  role="presentation"
                  className={cn(
                    "rounded-lg border p-1.5 text-left transition sm:p-2",
                    fillHeight && "flex h-full min-h-[52px] flex-col",
                    !fillHeight && (compact ? "min-h-[52px]" : "min-h-[72px]"),
                    inMonth
                      ? "border-slate-200 bg-white"
                      : "border-transparent bg-slate-50/60 text-slate-300",
                    isToday && inMonth && "ring-2 ring-brand-cyan/40",
                  )}
                >
                  <button
                    type="button"
                    disabled={!inMonth}
                    onClick={() => handleDayClick(dateKey)}
                    className={cn(
                      "w-full text-left",
                      inMonth && (canRegisterOnDay || dayEntries.length > 0)
                        ? "cursor-pointer hover:opacity-80"
                        : "cursor-default",
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs font-medium",
                        inMonth ? "text-slate-700" : "text-slate-300",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </button>
                  {dayEntries.length > 0 && inMonth ? (
                    <div className="mt-1 flex flex-col gap-0.5 sm:mt-2">
                      {dayEntries.slice(0, compact ? 2 : 4).map((entry) => {
                        const entryColor =
                          resolvedColorMap[entry.user_id] ?? "#64748b";

                        return (
                          <button
                            key={entry.id}
                            type="button"
                            className="inline-flex max-w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-semibold sm:px-1.5"
                            style={getUserScheduleBadgeStyle(entryColor)}
                            title={`${userNameMap[entry.user_id] ?? "알 수 없음"} · ${USER_SCHEDULE_ENTRY_LABELS[entry.entry_type]}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              openEntryDialog(entry);
                            }}
                          >
                            {USER_SCHEDULE_ENTRY_SHORT_LABELS[entry.entry_type]}
                          </button>
                        );
                      })}
                      {dayEntries.length > (compact ? 2 : 4) ? (
                        <span className="text-[10px] text-slate-400">
                          +{dayEntries.length - (compact ? 2 : 4)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {!compact &&
                  dayEntries.length === 1 &&
                  dayEntries[0]?.note?.trim() &&
                  inMonth ? (
                    <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-slate-500">
                      {dayEntries[0].note}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-slate-500">일정을 불러오는 중...</p>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "view"
                ? "일정 상세"
                : selectedDate && endDate
                  ? selectedDate === endDate
                    ? format(parseISO(selectedDate), "yyyy-MM-dd (EEE)", {
                        locale: ko,
                      })
                    : `${format(parseISO(selectedDate), "yyyy-MM-dd", { locale: ko })} ~ ${format(parseISO(endDate), "yyyy-MM-dd", { locale: ko })}`
                  : "일정 등록"}
            </DialogTitle>
          </DialogHeader>

          {dialogMode === "view" && viewingEntry ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    등록자
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {userDisplayMap[viewingEntry.user_id] ?? "알 수 없음"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    날짜
                  </p>
                  <p className="mt-1 text-sm text-slate-800">
                    {format(
                      parseISO(viewingEntry.schedule_date),
                      "yyyy-MM-dd (EEE)",
                      { locale: ko },
                    )}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  구분
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  {USER_SCHEDULE_ENTRY_LABELS[viewingEntry.entry_type]}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  메모
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                  {viewingEntry.note?.trim() || "-"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schedule-start-date">시작일</Label>
                  <Input
                    id="schedule-start-date"
                    type="date"
                    value={selectedDate ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setSelectedDate(value);
                      if (endDate && value > endDate) {
                        setEndDate(value);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-end-date">종료일</Label>
                  <Input
                    id="schedule-end-date"
                    type="date"
                    value={endDate ?? ""}
                    min={selectedDate ?? undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                종료일을 시작일보다 늦게 설정하면 해당 기간에 일괄 등록됩니다. (최대 31일)
              </p>

              <div className="space-y-2">
                <Label>구분</Label>
                <Select
                  value={entryType}
                  onValueChange={(value) =>
                    setEntryType((value ?? "business_trip") as UserScheduleEntryType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_SCHEDULE_ENTRY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {USER_SCHEDULE_ENTRY_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule-note">메모 (선택)</Label>
                <Input
                  id="schedule-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="예: 고객사 방문, 연차"
                />
              </div>

              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              ) : null}
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            {dialogMode === "edit" && viewingEntry ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={isSubmitting}
              >
                삭제
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                {dialogMode === "view" ? "닫기" : "취소"}
              </Button>
              {dialogMode !== "view" ? (
                <Button
                  type="button"
                  className="bg-brand-navy hover:bg-brand-navy-dark"
                  onClick={() => void handleSave()}
                  disabled={
                    isSubmitting ||
                    !selectedDate ||
                    !endDate ||
                    endDate < selectedDate
                  }
                >
                  {isSubmitting ? "저장 중..." : "저장"}
                </Button>
              ) : null}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
