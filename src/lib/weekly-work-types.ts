export const WEEKLY_WORK_TYPES = ["project", "misc"] as const;

export type WeeklyWorkType = (typeof WEEKLY_WORK_TYPES)[number];

export interface WeeklyWorkDayEntry {
  plan: string;
  actual: string;
  overtime: boolean;
}

/** yyyy-MM-dd -> 해당 날짜 계획·실적 */
export type WeeklyWorkDailyEntries = Record<string, WeeklyWorkDayEntry>;

export interface WeeklyWork {
  id: string;
  user_id: string;
  week_start: string;
  work_type: WeeklyWorkType;
  project_name: string | null;
  content: string | null;
  daily_entries: WeeklyWorkDailyEntries;
  created_at: string;
  updated_at: string;
}

export interface WeeklyWorkInput {
  week_start: string;
  work_type: WeeklyWorkType;
  project_name?: string;
  content?: string;
  daily_entries?: WeeklyWorkDailyEntries;
}

export interface WeeklyWorkFilters {
  user_id?: string;
  week_start?: string;
  work_type?: WeeklyWorkType;
  search?: string;
}

export const WEEKLY_WORK_TYPE_LABELS: Record<WeeklyWorkType, string> = {
  project: "프로젝트",
  misc: "잡무",
};
