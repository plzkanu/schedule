import { eachDayOfInterval, isValid, parseISO } from "date-fns";
import {
  USER_SCHEDULE_ENTRY_TYPES,
  type UserScheduleEntryInput,
  type UserScheduleEntryType,
} from "./user-schedule-types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_SCHEDULE_RANGE_DAYS = 31;

function parseScheduleDate(value: string) {
  if (!DATE_PATTERN.test(value)) {
    return null;
  }
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function getScheduleDateRange(input: UserScheduleEntryInput) {
  const startValue = input.schedule_date?.trim() ?? "";
  const endValue = input.schedule_end_date?.trim() || startValue;
  const start = parseScheduleDate(startValue);
  const end = parseScheduleDate(endValue);

  if (!start || !end || end < start) {
    return null;
  }

  const dates = eachDayOfInterval({ start, end });
  if (dates.length > MAX_SCHEDULE_RANGE_DAYS) {
    return null;
  }

  return dates;
}

export function validateUserScheduleInput(
  input: UserScheduleEntryInput,
): string | null {
  const startValue = input.schedule_date?.trim() ?? "";
  const endValue = input.schedule_end_date?.trim() || startValue;
  const entryType = input.entry_type;

  if (!startValue || !DATE_PATTERN.test(startValue)) {
    return "시작일 형식이 올바르지 않습니다.";
  }
  if (!endValue || !DATE_PATTERN.test(endValue)) {
    return "종료일 형식이 올바르지 않습니다.";
  }

  const start = parseScheduleDate(startValue);
  const end = parseScheduleDate(endValue);
  if (!start || !end) {
    return "일정 날짜 형식이 올바르지 않습니다.";
  }
  if (end < start) {
    return "종료일은 시작일 이후여야 합니다.";
  }

  const dayCount = eachDayOfInterval({ start, end }).length;
  if (dayCount > MAX_SCHEDULE_RANGE_DAYS) {
    return `일정은 최대 ${MAX_SCHEDULE_RANGE_DAYS}일까지 등록할 수 있습니다.`;
  }

  if (!entryType || !USER_SCHEDULE_ENTRY_TYPES.includes(entryType)) {
    return "일정 구분(외근/휴가)을 선택해 주세요.";
  }

  if (input.note && input.note.trim().length > 200) {
    return "메모는 200자 이하여야 합니다.";
  }

  return null;
}

export function normalizeUserScheduleInput(
  input: UserScheduleEntryInput,
): UserScheduleEntryInput {
  const scheduleDate = input.schedule_date.trim();
  const scheduleEndDate = input.schedule_end_date?.trim();

  return {
    schedule_date: scheduleDate,
    schedule_end_date:
      scheduleEndDate && scheduleEndDate !== scheduleDate
        ? scheduleEndDate
        : undefined,
    entry_type: input.entry_type as UserScheduleEntryType,
    note: input.note?.trim() || undefined,
    user_id: input.user_id?.trim() || undefined,
  };
}
