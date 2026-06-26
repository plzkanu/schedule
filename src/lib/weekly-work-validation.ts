import {
  WEEKLY_WORK_TYPES,
  type WeeklyWorkInput,
  type WeeklyWorkType,
} from "./weekly-work-types";
import {
  countFilledDailyEntries,
  getWeekStart,
  normalizeDailyEntries,
  parseDayEntry,
} from "./weekly-work-utils";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAILY_ENTRY_LENGTH = 1000;

export function validateWeeklyWorkInput(input: WeeklyWorkInput): string | null {
  const weekStart = input.week_start?.trim() ?? "";
  const workType = input.work_type;

  if (!weekStart || !DATE_PATTERN.test(weekStart)) {
    return "주간 시작일(월요일) 형식이 올바르지 않습니다.";
  }

  if (!workType || !WEEKLY_WORK_TYPES.includes(workType)) {
    return "업무 구분(프로젝트/잡무)을 선택해 주세요.";
  }

  const dailyEntries = normalizeDailyEntries(input.daily_entries, weekStart);
  const filledDayCount = countFilledDailyEntries(dailyEntries);

  if (filledDayCount === 0) {
    return "요일별 계획 또는 실적을 최소 1일 이상 입력해 주세요.";
  }

  for (const entry of Object.values(dailyEntries)) {
    const day = parseDayEntry(entry);
    if (day.plan.length > MAX_DAILY_ENTRY_LENGTH) {
      return `계획은 하루당 ${MAX_DAILY_ENTRY_LENGTH}자 이하여야 합니다.`;
    }
    if (day.actual.length > MAX_DAILY_ENTRY_LENGTH) {
      return `실적은 하루당 ${MAX_DAILY_ENTRY_LENGTH}자 이하여야 합니다.`;
    }
  }

  if (workType === "project") {
    if (!input.project_name?.trim()) {
      return "프로젝트명을 입력해 주세요.";
    }
    if (input.project_name.trim().length > 200) {
      return "프로젝트명은 200자 이하여야 합니다.";
    }
  }

  if (workType === "misc") {
    if (input.content?.trim() && input.content.trim().length > 200) {
      return "업무 개요는 200자 이하여야 합니다.";
    }
  }

  return null;
}

export function normalizeWeeklyWorkInput(
  input: WeeklyWorkInput,
): WeeklyWorkInput {
  const workType = input.work_type as WeeklyWorkType;
  const weekStart = input.week_start?.trim() || getWeekStart();
  const dailyEntries = normalizeDailyEntries(input.daily_entries, weekStart);

  if (workType === "project") {
    return {
      week_start: weekStart,
      work_type: workType,
      project_name: input.project_name?.trim() ?? "",
      daily_entries: dailyEntries,
    };
  }

  const overview = input.content?.trim();
  const firstEntry = Object.values(dailyEntries)[0];
  const firstDayContent = firstEntry
    ? firstEntry.actual.trim() || firstEntry.plan.trim()
    : "";

  return {
    week_start: weekStart,
    work_type: workType,
    content: overview || firstDayContent,
    daily_entries: dailyEntries,
  };
}
