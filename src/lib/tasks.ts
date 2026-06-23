import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import { logProjectActivity } from "@/lib/activity-logs";
import {
  normalizeTaskInput,
  normalizeTaskRecords,
  validateTaskDependencies,
  validateTaskHierarchy,
  validateTaskInput,
} from "@/lib/task-validation";
import { sortTasksHierarchically } from "@/lib/task-hierarchy";
import type {
  ItTask,
  TaskInput,
  TaskWithDependencies,
} from "@/lib/task-types";
import { format } from "date-fns";

interface FetchResult<T> {
  data: T;
  error: string | null;
}

async function syncTaskDependencies(
  taskId: string,
  dependencyIds: string[],
): Promise<string | null> {
  const supabase = createServerClient();

  const { error: deleteError } = await supabase
    .from("it_task_dependencies")
    .delete()
    .eq("task_id", taskId);

  if (deleteError) {
    return formatSupabaseNetworkError(deleteError.message);
  }

  if (dependencyIds.length === 0) {
    return null;
  }

  const { error: insertError } = await supabase
    .from("it_task_dependencies")
    .insert(
      dependencyIds.map((dependsOnId) => ({
        task_id: taskId,
        depends_on_task_id: dependsOnId,
      })),
    );

  if (insertError) {
    return formatSupabaseNetworkError(insertError.message);
  }

  return null;
}

function attachDependencies(
  tasks: ItTask[],
  dependencyRows: { task_id: string; depends_on_task_id: string }[],
): TaskWithDependencies[] {
  const dependencyMap = new Map<string, string[]>();

  for (const row of dependencyRows) {
    const current = dependencyMap.get(row.task_id) ?? [];
    current.push(row.depends_on_task_id);
    dependencyMap.set(row.task_id, current);
  }

  return tasks.map((task) => ({
    ...task,
    dependency_ids: dependencyMap.get(task.id) ?? [],
  }));
}

export async function listProjectTasks(
  projectId: string,
): Promise<FetchResult<TaskWithDependencies[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  try {
    const supabase = createServerClient();
    const { data: tasks, error: tasksError } = await supabase
      .from("it_tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (tasksError) {
      return { data: [], error: formatSupabaseNetworkError(tasksError.message) };
    }

    const taskList = normalizeTaskRecords((tasks ?? []) as ItTask[]);
    if (taskList.length === 0) {
      return { data: [], error: null };
    }

    const taskIds = taskList.map((task) => task.id);
    const { data: dependencies, error: depsError } = await supabase
      .from("it_task_dependencies")
      .select("task_id, depends_on_task_id")
      .in("task_id", taskIds);

    if (depsError) {
      return { data: [], error: formatSupabaseNetworkError(depsError.message) };
    }

    return {
      data: sortTasksHierarchically(
        attachDependencies(taskList, dependencies ?? []),
      ),
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "태스크 목록 조회에 실패했습니다.";
    return { data: [], error: formatSupabaseNetworkError(message) };
  }
}

export async function getProjectTask(
  projectId: string,
  taskId: string,
): Promise<FetchResult<TaskWithDependencies | null>> {
  const { data: tasks, error } = await listProjectTasks(projectId);
  if (error) {
    return { data: null, error };
  }

  const task = tasks.find((item) => item.id === taskId) ?? null;
  return { data: task, error: null };
}

export async function createProjectTask(
  projectId: string,
  input: TaskInput,
  userId: string,
): Promise<FetchResult<TaskWithDependencies | null>> {
  const validationError = validateTaskInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  const depError = validateTaskDependencies(undefined, input.dependency_ids ?? []);
  if (depError) {
    return { data: null, error: depError };
  }

  try {
    const supabase = createServerClient();
    const { data: existingRows, error: existingError } = await supabase
      .from("it_tasks")
      .select("*")
      .eq("project_id", projectId);

    if (existingError) {
      return {
        data: null,
        error: formatSupabaseNetworkError(existingError.message),
      };
    }

    const existingTasks = normalizeTaskRecords((existingRows ?? []) as ItTask[]);
    const hierarchyError = validateTaskHierarchy(input, existingTasks);
    if (hierarchyError) {
      return { data: null, error: hierarchyError };
    }

    const payload = normalizeTaskInput(input);
    const { dependency_ids, ...taskPayload } = payload;

    const { data, error } = await supabase
      .from("it_tasks")
      .insert({
        ...taskPayload,
        project_id: projectId,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      return { data: null, error: formatSupabaseNetworkError(error.message) };
    }

    const syncError = await syncTaskDependencies(data.id, dependency_ids);
    if (syncError) {
      return { data: null, error: syncError };
    }

    await logProjectActivity({
      projectId,
      userId,
      action: "태스크 생성",
      content: `"${payload.name}" 태스크를 등록했습니다.`,
    });

    return {
      data: { ...(data as ItTask), dependency_ids },
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "태스크 등록에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function updateProjectTask(
  projectId: string,
  taskId: string,
  input: TaskInput,
  userId: string,
): Promise<FetchResult<TaskWithDependencies | null>> {
  const validationError = validateTaskInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  const depError = validateTaskDependencies(taskId, input.dependency_ids ?? []);
  if (depError) {
    return { data: null, error: depError };
  }

  try {
    const supabase = createServerClient();
    const { data: existingRows, error: existingError } = await supabase
      .from("it_tasks")
      .select("*")
      .eq("project_id", projectId);

    if (existingError) {
      return {
        data: null,
        error: formatSupabaseNetworkError(existingError.message),
      };
    }

    const existingTasks = normalizeTaskRecords((existingRows ?? []) as ItTask[]);
    const hierarchyError = validateTaskHierarchy(input, existingTasks, taskId);
    if (hierarchyError) {
      return { data: null, error: hierarchyError };
    }

    const payload = normalizeTaskInput(input);
    const { dependency_ids, ...taskPayload } = payload;

    const { data, error } = await supabase
      .from("it_tasks")
      .update({
        ...taskPayload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("project_id", projectId)
      .select("*")
      .maybeSingle();

    if (error) {
      return { data: null, error: formatSupabaseNetworkError(error.message) };
    }

    if (!data) {
      return { data: null, error: "태스크를 찾을 수 없습니다." };
    }

    const syncError = await syncTaskDependencies(taskId, dependency_ids);
    if (syncError) {
      return { data: null, error: syncError };
    }

    await logProjectActivity({
      projectId,
      userId,
      action: "태스크 수정",
      content: `"${payload.name}" 태스크 정보를 수정했습니다.`,
    });

    return {
      data: { ...(data as ItTask), dependency_ids },
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "태스크 수정에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function updateProjectTaskSchedule(
  projectId: string,
  taskId: string,
  startDate: string,
  endDate: string,
  userId: string,
): Promise<{ error: string | null }> {
  if (startDate > endDate) {
    return { error: "종료일은 시작일 이후여야 합니다." };
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("it_tasks")
      .update({
        start_date: startDate,
        end_date: endDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("project_id", projectId)
      .select("name")
      .maybeSingle();

    if (error) {
      return { error: formatSupabaseNetworkError(error.message) };
    }

    if (!data) {
      return { error: "태스크를 찾을 수 없습니다." };
    }

    await logProjectActivity({
      projectId,
      userId,
      action: "일정변경",
      content: `"${data.name}" 태스크 일정을 ${startDate} ~ ${endDate}로 변경했습니다.`,
    });

    return { error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "태스크 일정 변경에 실패했습니다.";
    return { error: formatSupabaseNetworkError(message) };
  }
}

export async function updateProjectTaskProgress(
  projectId: string,
  taskId: string,
  progress: number,
  userId: string,
): Promise<{ error: string | null }> {
  if (progress < 0 || progress > 100) {
    return { error: "진행률은 0~100 사이여야 합니다." };
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("it_tasks")
      .update({
        progress,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("project_id", projectId)
      .select("name")
      .maybeSingle();

    if (error) {
      return { error: formatSupabaseNetworkError(error.message) };
    }

    if (!data) {
      return { error: "태스크를 찾을 수 없습니다." };
    }

    await logProjectActivity({
      projectId,
      userId,
      action: "진행률변경",
      content: `"${data.name}" 태스크 진행률을 ${progress}%로 변경했습니다.`,
    });

    return { error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "태스크 진행률 변경에 실패했습니다.";
    return { error: formatSupabaseNetworkError(message) };
  }
}

export async function deleteProjectTask(
  projectId: string,
  taskId: string,
  userId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = createServerClient();
    const { data: existing } = await supabase
      .from("it_tasks")
      .select("name")
      .eq("id", taskId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (!existing) {
      return { error: "태스크를 찾을 수 없습니다." };
    }

    const { data: childRows } = await supabase
      .from("it_tasks")
      .select("id, name")
      .eq("parent_task_id", taskId)
      .eq("project_id", projectId);

    const childCount = childRows?.length ?? 0;

    await logProjectActivity({
      projectId,
      userId,
      action: "태스크 삭제",
      content:
        childCount > 0
          ? `"${existing.name}" 상위 태스크와 하위 태스크 ${childCount}개를 삭제했습니다.`
          : `"${existing.name}" 태스크를 삭제했습니다.`,
    });

    const { error } = await supabase
      .from("it_tasks")
      .delete()
      .eq("id", taskId)
      .eq("project_id", projectId);

    if (error) {
      return { error: formatSupabaseNetworkError(error.message) };
    }

    return { error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "태스크 삭제에 실패했습니다.";
    return { error: formatSupabaseNetworkError(message) };
  }
}

export function formatTaskDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function parseTaskDate(value: string) {
  return new Date(`${value}T00:00:00`);
}
