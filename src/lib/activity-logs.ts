import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";

export interface ActivityLog {
  id: string;
  project_id: string | null;
  task_id: string | null;
  user_id: string | null;
  action: string;
  content: string | null;
  created_at: string;
}

export async function logProjectActivity(params: {
  projectId: string;
  userId: string;
  action: string;
  content?: string;
  taskId?: string;
}): Promise<{ error: string | null }> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("it_activity_logs").insert({
      project_id: params.projectId,
      task_id: params.taskId ?? null,
      user_id: params.userId,
      action: params.action,
      content: params.content ?? null,
    });

    if (error) {
      return { error: formatSupabaseNetworkError(error.message) };
    }

    return { error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "활동 이력 저장에 실패했습니다.";
    return { error: formatSupabaseNetworkError(message) };
  }
}

export async function listRecentActivityLogs(
  limit = 5,
): Promise<{ data: ActivityLog[]; error: string | null }> {
  return listActivityLogsPaginated(1, limit).then(({ data, error }) => ({
    data,
    error,
  }));
}

export async function listActivityLogsPaginated(
  page = 1,
  pageSize = 20,
): Promise<{ data: ActivityLog[]; total: number; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: [], total: 0, error: null };
  }

  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const supabase = createServerClient();
    const { data, error, count } = await supabase
      .from("it_activity_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return { data: [], total: 0, error: formatSupabaseNetworkError(error.message) };
    }

    return {
      data: (data ?? []) as ActivityLog[],
      total: count ?? 0,
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "활동 이력 조회에 실패했습니다.";
    return { data: [], total: 0, error: formatSupabaseNetworkError(message) };
  }
}

export async function listProjectActivityLogs(
  projectId: string,
  limit = 30,
): Promise<{ data: ActivityLog[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("it_activity_logs")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { data: [], error: formatSupabaseNetworkError(error.message) };
    }

    return { data: (data ?? []) as ActivityLog[], error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "활동 이력 조회에 실패했습니다.";
    return { data: [], error: formatSupabaseNetworkError(message) };
  }
}
