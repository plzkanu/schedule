import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import { logProjectActivity } from "@/lib/activity-logs";
import {
  normalizeIssueInput,
  validateIssueInput,
} from "@/lib/issue-validation";
import type { ProjectIssue, ProjectIssueInput } from "@/lib/issue-types";

interface FetchResult<T> {
  data: T;
  error: string | null;
}

export async function listProjectIssues(
  projectId: string,
): Promise<FetchResult<ProjectIssue[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("it_project_issues")
      .select("*")
      .eq("project_id", projectId)
      .order("occurred_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: formatSupabaseNetworkError(error.message) };
    }

    return { data: (data ?? []) as ProjectIssue[], error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "이슈 목록 조회에 실패했습니다.";
    return { data: [], error: formatSupabaseNetworkError(message) };
  }
}

export async function createProjectIssue(
  projectId: string,
  input: ProjectIssueInput,
  userId: string,
): Promise<FetchResult<ProjectIssue | null>> {
  const validationError = validateIssueInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  try {
    const supabase = createServerClient();
    const payload = normalizeIssueInput(input);
    const { data, error } = await supabase
      .from("it_project_issues")
      .insert({
        project_id: projectId,
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      return { data: null, error: formatSupabaseNetworkError(error.message) };
    }

    const issue = data as ProjectIssue;
    await logProjectActivity({
      projectId,
      userId,
      action: "이슈 등록",
      content: `"${issue.title}" (${issue.severity} · ${issue.status})`,
    });

    return { data: issue, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "이슈 등록에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function updateProjectIssue(
  projectId: string,
  issueId: string,
  input: ProjectIssueInput,
  userId: string,
): Promise<FetchResult<ProjectIssue | null>> {
  const validationError = validateIssueInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  try {
    const supabase = createServerClient();
    const payload = normalizeIssueInput(input);
    const { data, error } = await supabase
      .from("it_project_issues")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", issueId)
      .eq("project_id", projectId)
      .select("*")
      .maybeSingle();

    if (error) {
      return { data: null, error: formatSupabaseNetworkError(error.message) };
    }

    if (!data) {
      return { data: null, error: "이슈를 찾을 수 없습니다." };
    }

    const issue = data as ProjectIssue;
    await logProjectActivity({
      projectId,
      userId,
      action: "이슈 수정",
      content: `"${issue.title}" → ${issue.status}`,
    });

    return { data: issue, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "이슈 수정에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function deleteProjectIssue(
  projectId: string,
  issueId: string,
  userId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = createServerClient();
    const { data: existing } = await supabase
      .from("it_project_issues")
      .select("title")
      .eq("id", issueId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (!existing) {
      return { error: "이슈를 찾을 수 없습니다." };
    }

    const { error } = await supabase
      .from("it_project_issues")
      .delete()
      .eq("id", issueId)
      .eq("project_id", projectId);

    if (error) {
      return { error: formatSupabaseNetworkError(error.message) };
    }

    await logProjectActivity({
      projectId,
      userId,
      action: "이슈 삭제",
      content: `"${existing.title}"`,
    });

    return { error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "이슈 삭제에 실패했습니다.";
    return { error: formatSupabaseNetworkError(message) };
  }
}
