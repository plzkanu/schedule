import type { WeeklyWork } from "./weekly-work-types";

export interface AssigneeWeeklyWorkGroup {
  userId: string;
  userLabel: string;
  items: WeeklyWork[];
}

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

export function groupWeeklyWorkByAssignee(
  items: WeeklyWork[],
  userMap: Record<string, string>,
): AssigneeWeeklyWorkGroup[] {
  const grouped = new Map<string, WeeklyWork[]>();

  for (const item of items) {
    const list = grouped.get(item.user_id) ?? [];
    list.push(item);
    grouped.set(item.user_id, list);
  }

  return Array.from(grouped.entries())
    .map(([userId, groupItems]) => ({
      userId,
      userLabel: userMap[userId] ?? "담당자 미지정",
      items: sortWeeklyWorkForList(groupItems),
    }))
    .sort((a, b) => a.userLabel.localeCompare(b.userLabel, "ko"));
}
