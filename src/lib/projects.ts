import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import { logProjectActivity } from "@/lib/activity-logs";
import {
  normalizeProjectInput,
  validateProjectInput,
} from "@/lib/project-validation";
import { sortProjectsForList } from "@/lib/project-sort";
import type {
  Project,
  ProjectFilters,
  ProjectInput,
} from "@/lib/project-types";

interface FetchResult<T> {
  data: T;
  error: string | null;
}

function mapProject(row: Project): Project {
  return row;
}

export async function listProjects(
  filters: ProjectFilters = {},
): Promise<FetchResult<Project[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  try {
    const supabase = createServerClient();
    let query = supabase
      .from("it_projects")
      .select("*")
      .order("updated_at", { ascending: false });

    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.priority) {
      query = query.eq("priority", filters.priority);
    }
    if (filters.owner_id) {
      query = query.eq("owner_id", filters.owner_id);
    }
    if (filters.progress_min !== undefined) {
      query = query.gte("progress", filters.progress_min);
    }
    if (filters.progress_max !== undefined) {
      query = query.lte("progress", filters.progress_max);
    }
    if (filters.search?.trim()) {
      query = query.ilike("name", `%${filters.search.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: formatSupabaseNetworkError(error.message) };
    }

    return { data: sortProjectsForList((data ?? []).map(mapProject)), error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "프로젝트 목록 조회에 실패했습니다.";
    return { data: [], error: formatSupabaseNetworkError(message) };
  }
}

export async function getProject(
  id: string,
): Promise<FetchResult<Project | null>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: null };
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("it_projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { data: null, error: formatSupabaseNetworkError(error.message) };
    }

    return { data: data ? mapProject(data) : null, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "프로젝트 조회에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function createProject(
  input: ProjectInput,
  userId: string,
): Promise<FetchResult<Project | null>> {
  const validationError = validateProjectInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  try {
    const supabase = createServerClient();
    const payload = normalizeProjectInput(input);
    const { data, error } = await supabase
      .from("it_projects")
      .insert({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      return { data: null, error: formatSupabaseNetworkError(error.message) };
    }

    await logProjectActivity({
      projectId: data.id,
      userId,
      action: "프로젝트 생성",
      content: `"${payload.name}" 프로젝트를 등록했습니다.`,
    });

    return { data: mapProject(data), error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "프로젝트 등록에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function updateProject(
  id: string,
  input: ProjectInput,
  userId: string,
): Promise<FetchResult<Project | null>> {
  const validationError = validateProjectInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  try {
    const supabase = createServerClient();
    const payload = normalizeProjectInput(input);
    const { data, error } = await supabase
      .from("it_projects")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      return { data: null, error: formatSupabaseNetworkError(error.message) };
    }

    if (!data) {
      return { data: null, error: "프로젝트를 찾을 수 없습니다." };
    }

    await logProjectActivity({
      projectId: id,
      userId,
      action: "프로젝트 수정",
      content: `"${payload.name}" 프로젝트 정보를 수정했습니다.`,
    });

    return { data: mapProject(data), error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "프로젝트 수정에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function deleteProject(
  id: string,
  userId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = createServerClient();
    const { data: existing } = await supabase
      .from("it_projects")
      .select("name")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return { error: "프로젝트를 찾을 수 없습니다." };
    }

    await logProjectActivity({
      projectId: id,
      userId,
      action: "프로젝트 삭제",
      content: `"${existing.name}" 프로젝트를 삭제했습니다.`,
    });

    const { error } = await supabase.from("it_projects").delete().eq("id", id);

    if (error) {
      return { error: formatSupabaseNetworkError(error.message) };
    }

    return { error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "프로젝트 삭제에 실패했습니다.";
    return { error: formatSupabaseNetworkError(message) };
  }
}
