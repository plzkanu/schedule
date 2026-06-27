import { endOfMonth, format, startOfMonth } from "date-fns";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import {
  getScheduleDateRange,
  normalizeUserScheduleInput,
  validateUserScheduleInput,
} from "@/lib/user-schedule-validation";
import type {
  UserScheduleEntry,
  UserScheduleEntryInput,
  UserScheduleFilters,
} from "@/lib/user-schedule-types";

interface FetchResult<T> {
  data: T;
  error: string | null;
}

function getMonthRange(year: number, month: number) {
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);
  return {
    from: format(start, "yyyy-MM-dd"),
    to: format(end, "yyyy-MM-dd"),
  };
}

export async function listUserScheduleEntries(
  filters: UserScheduleFilters,
): Promise<FetchResult<UserScheduleEntry[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  try {
    const { from, to } = getMonthRange(filters.year, filters.month);
    const supabase = createServerClient();
    let query = supabase
      .from("it_user_schedule_entries")
      .select("*")
      .gte("schedule_date", from)
      .lte("schedule_date", to)
      .order("schedule_date", { ascending: true });

    if (filters.user_id) {
      query = query.eq("user_id", filters.user_id);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: formatSupabaseNetworkError(error.message) };
    }

    return { data: (data ?? []) as UserScheduleEntry[], error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "일정 조회에 실패했습니다.";
    return { data: [], error: formatSupabaseNetworkError(message) };
  }
}

export async function getUserScheduleEntry(
  id: string,
): Promise<FetchResult<UserScheduleEntry | null>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: null };
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("it_user_schedule_entries")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { data: null, error: formatSupabaseNetworkError(error.message) };
    }

    return { data: (data as UserScheduleEntry | null) ?? null, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "일정 조회에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function upsertUserScheduleEntry(
  userId: string,
  input: UserScheduleEntryInput,
): Promise<FetchResult<UserScheduleEntry | null>> {
  const { data, error } = await upsertUserScheduleEntryRange(userId, input);
  if (error) {
    return { data: null, error };
  }
  return { data: data[0] ?? null, error: null };
}

export async function upsertUserScheduleEntryRange(
  userId: string,
  input: UserScheduleEntryInput,
): Promise<FetchResult<UserScheduleEntry[]>> {
  const validationError = validateUserScheduleInput(input);
  if (validationError) {
    return { data: [], error: validationError };
  }

  const payload = normalizeUserScheduleInput(input);
  const dates = getScheduleDateRange(payload);
  if (!dates) {
    return { data: [], error: "일정 날짜 형식이 올바르지 않습니다." };
  }

  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();
    const rows = dates.map((date) => ({
      user_id: userId,
      schedule_date: format(date, "yyyy-MM-dd"),
      entry_type: payload.entry_type,
      note: payload.note ?? null,
      updated_at: now,
    }));

    const { data, error } = await supabase
      .from("it_user_schedule_entries")
      .upsert(rows, { onConflict: "user_id,schedule_date" })
      .select("*")
      .order("schedule_date", { ascending: true });

    if (error) {
      return { data: [], error: formatSupabaseNetworkError(error.message) };
    }

    return { data: (data ?? []) as UserScheduleEntry[], error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "일정 등록에 실패했습니다.";
    return { data: [], error: formatSupabaseNetworkError(message) };
  }
}

export async function deleteUserScheduleEntry(
  id: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = createServerClient();
    const { data: existing } = await supabase
      .from("it_user_schedule_entries")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return { error: "일정을 찾을 수 없습니다." };
    }

    const { error } = await supabase
      .from("it_user_schedule_entries")
      .delete()
      .eq("id", id);

    if (error) {
      return { error: formatSupabaseNetworkError(error.message) };
    }

    return { error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "일정 삭제에 실패했습니다.";
    return { error: formatSupabaseNetworkError(message) };
  }
}

export async function listUpcomingUserScheduleEntries(
  days = 14,
): Promise<FetchResult<UserScheduleEntry[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  try {
    const today = format(new Date(), "yyyy-MM-dd");
    const end = format(
      new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      "yyyy-MM-dd",
    );
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("it_user_schedule_entries")
      .select("*")
      .gte("schedule_date", today)
      .lte("schedule_date", end)
      .order("schedule_date", { ascending: true });

    if (error) {
      return { data: [], error: formatSupabaseNetworkError(error.message) };
    }

    return { data: (data ?? []) as UserScheduleEntry[], error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "일정 조회에 실패했습니다.";
    return { data: [], error: formatSupabaseNetworkError(message) };
  }
}
