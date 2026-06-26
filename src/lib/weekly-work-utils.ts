import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { ko } from "date-fns/locale";
import type {
  WeeklyWork,
  WeeklyWorkDailyEntries,
  WeeklyWorkDayEntry,
} from "@/lib/weekly-work-types";

/** 해당 날짜가 속한 주의 월요일 (yyyy-MM-dd) */
export function getWeekStart(date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function formatWeekRangeLabel(weekStart: string): string {
  const start = parseISO(weekStart);
  const end = addDays(start, 6);
  return `${format(start, "yyyy-MM-dd")} ~ ${format(end, "yyyy-MM-dd")}`;
}

export interface WeekDayInfo {
  date: string;
  label: string;
}

/** 주간 시작일(월)부터 일요일까지 7일 */
export function getWeekDays(weekStart: string): WeekDayInfo[] {
  const start = parseISO(weekStart);
  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(start, index);
    return {
      date: format(day, "yyyy-MM-dd"),
      label: format(day, "M/d (EEE)", { locale: ko }),
    };
  });
}

export function createEmptyDayEntry(): WeeklyWorkDayEntry {
  return { plan: "", actual: "", overtime: false };
}

/** 이전 문자열 형식 및 객체 형식 모두 지원 */
export function parseDayEntry(value: unknown): WeeklyWorkDayEntry {
  if (typeof value === "string") {
    return { plan: "", actual: value.trim(), overtime: false };
  }

  if (value && typeof value === "object") {
    const entry = value as Partial<WeeklyWorkDayEntry>;
    return {
      plan: (entry.plan ?? "").trim(),
      actual: (entry.actual ?? "").trim(),
      overtime: Boolean(entry.overtime),
    };
  }

  return createEmptyDayEntry();
}

export function isDayEntryFilled(entry: WeeklyWorkDayEntry): boolean {
  return Boolean(entry.plan.trim() || entry.actual.trim());
}

export function buildEmptyDailyEntries(weekStart: string): WeeklyWorkDailyEntries {
  return Object.fromEntries(
    getWeekDays(weekStart).map((day) => [day.date, createEmptyDayEntry()]),
  );
}

export function normalizeDailyEntries(
  entries: WeeklyWorkDailyEntries | Record<string, unknown> | undefined,
  weekStart: string,
): WeeklyWorkDailyEntries {
  const allowedDates = new Set(getWeekDays(weekStart).map((day) => day.date));
  const normalized: WeeklyWorkDailyEntries = {};

  for (const [date, value] of Object.entries(entries ?? {})) {
    if (!allowedDates.has(date)) continue;

    const entry = parseDayEntry(value);
    if (!isDayEntryFilled(entry) && !entry.overtime) {
      continue;
    }

    normalized[date] = {
      plan: entry.plan,
      actual: entry.actual,
      overtime: entry.overtime && Boolean(entry.actual.trim()),
    };
  }

  return normalized;
}

export function countFilledDailyEntries(
  entries: WeeklyWorkDailyEntries | Record<string, unknown> | undefined,
): number {
  return Object.values(entries ?? {}).filter((value) =>
    isDayEntryFilled(parseDayEntry(value)),
  ).length;
}

export function mergeDailyEntriesForWeek(
  weekStart: string,
  entries: WeeklyWorkDailyEntries | Record<string, unknown> | undefined,
): WeeklyWorkDailyEntries {
  const empty = buildEmptyDailyEntries(weekStart);
  const normalized = normalizeDailyEntries(entries, weekStart);
  const merged = { ...empty };

  for (const [date, entry] of Object.entries(normalized)) {
    merged[date] = entry;
  }

  return merged;
}

export function getDayEntryPreview(entry: WeeklyWorkDayEntry): string {
  if (entry.actual.trim()) {
    return entry.actual.trim();
  }
  return entry.plan.trim();
}

export function getWeeklyWorkSummary(item: {
  week_start: string;
  work_type: "project" | "misc";
  project_name: string | null;
  content: string | null;
  daily_entries?: WeeklyWorkDailyEntries | Record<string, unknown>;
}): string {
  if (item.work_type === "project") {
    return item.project_name?.trim() ?? "";
  }
  const overview = item.content?.trim();
  if (overview) {
    return overview;
  }
  const filled = getFilledDailyEntries(item);
  if (filled.length > 0) {
    return getDayEntryPreview(filled[0]);
  }
  return "";
}

export interface FilledDailyEntry extends WeekDayInfo {
  plan: string;
  actual: string;
  overtime: boolean;
}

export function getFilledDailyEntries(item: {
  week_start: string;
  daily_entries?: WeeklyWorkDailyEntries | Record<string, unknown>;
}): FilledDailyEntry[] {
  const days = getWeekDays(item.week_start);
  const entries = item.daily_entries ?? {};

  return days
    .map((day) => {
      const entry = parseDayEntry(entries[day.date]);
      return {
        ...day,
        plan: entry.plan,
        actual: entry.actual,
        overtime: entry.overtime,
      };
    })
    .filter((day) => isDayEntryFilled(day));
}

export function countOvertimeDays(item: {
  week_start: string;
  daily_entries?: WeeklyWorkDailyEntries | Record<string, unknown>;
}): number {
  return getFilledDailyEntries(item).filter(
    (day) => day.overtime && day.actual.trim(),
  ).length;
}

export function parseDailyEntriesFromRow(
  value: unknown,
): WeeklyWorkDailyEntries {
  if (!value || typeof value !== "object") {
    return {};
  }

  const parsed: WeeklyWorkDailyEntries = {};
  for (const [date, entry] of Object.entries(value as Record<string, unknown>)) {
    parsed[date] = parseDayEntry(entry);
  }
  return parsed;
}

export function parseWeeklyWorkRow(row: WeeklyWork): WeeklyWork {
  return {
    ...row,
    daily_entries: parseDailyEntriesFromRow(row.daily_entries),
  };
}
