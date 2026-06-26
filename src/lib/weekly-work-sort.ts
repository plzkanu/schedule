import type { WeeklyWork } from "./weekly-work-types";

export function sortWeeklyWorkForList(items: WeeklyWork[]): WeeklyWork[] {
  return [...items].sort((a, b) => {
    const weekCompare = b.week_start.localeCompare(a.week_start);
    if (weekCompare !== 0) {
      return weekCompare;
    }
    const typeCompare = a.work_type.localeCompare(b.work_type);
    if (typeCompare !== 0) {
      return typeCompare;
    }
    return b.updated_at.localeCompare(a.updated_at);
  });
}
