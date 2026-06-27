import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";

export const USER_SCHEDULE_COLOR_PALETTE = [
  "#0ea5e9",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f97316",
  "#84cc16",
] as const;

const COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export function isValidScheduleColor(color: string) {
  return COLOR_PATTERN.test(color);
}

export function getDefaultScheduleColor(userIndex: number) {
  return USER_SCHEDULE_COLOR_PALETTE[
    userIndex % USER_SCHEDULE_COLOR_PALETTE.length
  ];
}

export function buildDefaultScheduleColorMap(
  userIds: string[],
): Record<string, string> {
  return Object.fromEntries(
    userIds.map((userId, index) => [userId, getDefaultScheduleColor(index)]),
  );
}

export function resolveScheduleColorMap(
  userIds: string[],
  storedColors: Record<string, string>,
): Record<string, string> {
  const defaults = buildDefaultScheduleColorMap(userIds);
  const resolved = { ...defaults };

  for (const userId of userIds) {
    const stored = storedColors[userId];
    if (stored && isValidScheduleColor(stored)) {
      resolved[userId] = stored;
    }
  }

  return resolved;
}

export function getUserScheduleBadgeStyle(
  color: string,
): { backgroundColor: string; color: string; boxShadow: string } {
  return {
    backgroundColor: `${color}20`,
    color,
    boxShadow: `inset 0 0 0 1px ${color}55`,
  };
}

export async function listUserScheduleColors(): Promise<{
  data: Record<string, string>;
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    return { data: {}, error: null };
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("it_user_schedule_colors")
      .select("user_id, color");

    if (error) {
      return { data: {}, error: formatSupabaseNetworkError(error.message) };
    }

    const map = Object.fromEntries(
      (data ?? []).map((row) => [row.user_id as string, row.color as string]),
    );
    return { data: map, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "색상 조회에 실패했습니다.";
    return { data: {}, error: formatSupabaseNetworkError(message) };
  }
}

export async function upsertUserScheduleColor(
  userId: string,
  color: string,
): Promise<{ error: string | null }> {
  if (!isValidScheduleColor(color)) {
    return { error: "색상 형식이 올바르지 않습니다." };
  }

  if (!isSupabaseConfigured()) {
    return { error: "Supabase 설정이 필요합니다." };
  }

  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("it_user_schedule_colors").upsert(
      {
        user_id: userId.trim(),
        color,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      return { error: formatSupabaseNetworkError(error.message) };
    }

    return { error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "색상 저장에 실패했습니다.";
    return { error: formatSupabaseNetworkError(message) };
  }
}
