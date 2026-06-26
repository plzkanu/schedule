import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import { sortWeeklyWorkForList } from "@/lib/weekly-work-sort";
import {
  normalizeWeeklyWorkInput,
  validateWeeklyWorkInput,
} from "@/lib/weekly-work-validation";
import { parseWeeklyWorkRow } from "@/lib/weekly-work-utils";
import type {
  WeeklyWork,
  WeeklyWorkFilters,
  WeeklyWorkInput,
} from "@/lib/weekly-work-types";

interface FetchResult<T> {
  data: T;
  error: string | null;
}

export async function listWeeklyWork(
  filters: WeeklyWorkFilters = {},
): Promise<FetchResult<WeeklyWork[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  try {
    const supabase = createServerClient();
    let query = supabase.from("it_weekly_work").select("*");

    if (filters.user_id) {
      query = query.eq("user_id", filters.user_id);
    }
    if (filters.week_start) {
      query = query.eq("week_start", filters.week_start);
    }
    if (filters.work_type) {
      query = query.eq("work_type", filters.work_type);
    }
    if (filters.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      query = query.or(
        `project_name.ilike.${term},content.ilike.${term}`,
      );
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: formatSupabaseNetworkError(error.message) };
    }

    return {
      data: sortWeeklyWorkForList(
        (data ?? []).map((row) => parseWeeklyWorkRow(row as WeeklyWork)),
      ),
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "주간업무 목록 조회에 실패했습니다.";
    return { data: [], error: formatSupabaseNetworkError(message) };
  }
}

export async function getWeeklyWork(
  id: string,
): Promise<FetchResult<WeeklyWork | null>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: null };
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("it_weekly_work")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { data: null, error: formatSupabaseNetworkError(error.message) };
    }

    return {
      data: data ? parseWeeklyWorkRow(data as WeeklyWork) : null,
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "주간업무 조회에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function createWeeklyWork(
  userId: string,
  input: WeeklyWorkInput,
): Promise<FetchResult<WeeklyWork | null>> {
  const validationError = validateWeeklyWorkInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  try {
    const supabase = createServerClient();
    const payload = normalizeWeeklyWorkInput(input);
    const { data, error } = await supabase
      .from("it_weekly_work")
      .insert({
        user_id: userId,
        week_start: payload.week_start,
        work_type: payload.work_type,
        project_name:
          payload.work_type === "project" ? payload.project_name ?? null : null,
        content: payload.work_type === "misc" ? payload.content ?? null : null,
        daily_entries: payload.daily_entries ?? {},
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      return { data: null, error: formatSupabaseNetworkError(error.message) };
    }

    return { data: parseWeeklyWorkRow(data as WeeklyWork), error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "주간업무 등록에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function updateWeeklyWork(
  id: string,
  input: WeeklyWorkInput,
): Promise<FetchResult<WeeklyWork | null>> {
  const validationError = validateWeeklyWorkInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  try {
    const supabase = createServerClient();
    const payload = normalizeWeeklyWorkInput(input);
    const { data, error } = await supabase
      .from("it_weekly_work")
      .update({
        week_start: payload.week_start,
        work_type: payload.work_type,
        project_name:
          payload.work_type === "project" ? payload.project_name ?? null : null,
        content: payload.work_type === "misc" ? payload.content ?? null : null,
        daily_entries: payload.daily_entries ?? {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      return { data: null, error: formatSupabaseNetworkError(error.message) };
    }

    if (!data) {
      return { data: null, error: "주간업무를 찾을 수 없습니다." };
    }

    return { data: parseWeeklyWorkRow(data as WeeklyWork), error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "주간업무 수정에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function deleteWeeklyWork(
  id: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = createServerClient();
    const { data: existing } = await supabase
      .from("it_weekly_work")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return { error: "주간업무를 찾을 수 없습니다." };
    }

    const { error } = await supabase.from("it_weekly_work").delete().eq("id", id);

    if (error) {
      return { error: formatSupabaseNetworkError(error.message) };
    }

    return { error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "주간업무 삭제에 실패했습니다.";
    return { error: formatSupabaseNetworkError(message) };
  }
}
