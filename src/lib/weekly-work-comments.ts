import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import type { SessionUser } from "@/lib/types";
import {
  WEEKLY_WORK_RESPONSE_STATUSES,
  isWeeklyWorkOwnerComment,
  type WeeklyWorkComment,
  type WeeklyWorkResponseStatus,
  type WeeklyWorkUnreadSummary,
} from "@/lib/weekly-work-comment-types";

interface FetchResult<T> {
  data: T;
  error: string | null;
}

interface CommentRow {
  id: string;
  weekly_work_id: string;
  parent_id: string | null;
  author_id: string;
  content: string;
  status: WeeklyWorkResponseStatus | null;
  created_at: string;
}

interface WorkRow {
  id: string;
  user_id: string;
}

export function validateAdminCommentContent(content: string): string | null {
  const trimmed = content.trim();
  if (!trimmed) {
    return "코멘트 내용을 입력해 주세요.";
  }
  if (trimmed.length > 2000) {
    return "코멘트는 2000자 이하여야 합니다.";
  }
  return null;
}

export function validateUserResponseInput(
  status: WeeklyWorkResponseStatus | undefined,
  content: string,
): string | null {
  if (!status || !WEEKLY_WORK_RESPONSE_STATUSES.includes(status)) {
    return "상태(검토/진행/완료/반려)를 선택해 주세요.";
  }

  const trimmed = content.trim();
  if (trimmed.length > 2000) {
    return "코멘트는 2000자 이하여야 합니다.";
  }

  return null;
}

function parseComment(row: CommentRow): WeeklyWorkComment {
  return {
    id: row.id,
    weekly_work_id: row.weekly_work_id,
    parent_id: row.parent_id,
    author_id: row.author_id,
    content: row.content,
    status: row.status,
    created_at: row.created_at,
  };
}

function isUnreadForViewer(
  comment: CommentRow,
  workOwnerId: string,
  viewerRole: SessionUser["role"],
  readAt: string | undefined,
): boolean {
  const fromOwner = isWeeklyWorkOwnerComment(comment, workOwnerId);

  if (viewerRole === "admin") {
    if (!fromOwner) {
      return false;
    }
  } else {
    if (fromOwner) {
      return false;
    }
  }

  if (!readAt) {
    return true;
  }
  return comment.created_at > readAt;
}

async function getParentComment(
  weeklyWorkId: string,
  parentId: string,
): Promise<WeeklyWorkComment | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("it_weekly_work_comments")
    .select("*")
    .eq("id", parentId)
    .eq("weekly_work_id", weeklyWorkId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return parseComment(data as CommentRow);
}

export async function listWeeklyWorkComments(
  weeklyWorkId: string,
): Promise<FetchResult<WeeklyWorkComment[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("it_weekly_work_comments")
      .select("*")
      .eq("weekly_work_id", weeklyWorkId)
      .order("created_at", { ascending: true });

    if (error) {
      return { data: [], error: formatSupabaseNetworkError(error.message) };
    }

    return {
      data: ((data ?? []) as CommentRow[]).map(parseComment),
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "코멘트 조회에 실패했습니다.";
    return { data: [], error: formatSupabaseNetworkError(message) };
  }
}

export async function createWeeklyWorkAdminComment(
  weeklyWorkId: string,
  authorId: string,
  content: string,
  parentId?: string | null,
): Promise<FetchResult<WeeklyWorkComment | null>> {
  const validationError = validateAdminCommentContent(content);
  if (validationError) {
    return { data: null, error: validationError };
  }

  if (parentId) {
    const parent = await getParentComment(weeklyWorkId, parentId);
    if (!parent) {
      return { data: null, error: "답글 대상 코멘트를 찾을 수 없습니다." };
    }
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("it_weekly_work_comments")
      .insert({
        weekly_work_id: weeklyWorkId,
        parent_id: parentId ?? null,
        author_id: authorId,
        content: content.trim(),
        status: null,
      })
      .select("*")
      .single();

    if (error) {
      return { data: null, error: formatSupabaseNetworkError(error.message) };
    }

    return { data: parseComment(data as CommentRow), error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "코멘트 등록에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function createWeeklyWorkUserResponse(
  weeklyWorkId: string,
  authorId: string,
  status: WeeklyWorkResponseStatus,
  content: string,
  parentId: string,
): Promise<FetchResult<WeeklyWorkComment | null>> {
  const validationError = validateUserResponseInput(status, content);
  if (validationError) {
    return { data: null, error: validationError };
  }

  const parent = await getParentComment(weeklyWorkId, parentId);
  if (!parent) {
    return { data: null, error: "답글 대상 코멘트를 찾을 수 없습니다." };
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("it_weekly_work_comments")
      .insert({
        weekly_work_id: weeklyWorkId,
        parent_id: parentId,
        author_id: authorId,
        content: content.trim(),
        status,
      })
      .select("*")
      .single();

    if (error) {
      return { data: null, error: formatSupabaseNetworkError(error.message) };
    }

    return { data: parseComment(data as CommentRow), error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "응답 등록에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function markWeeklyWorkCommentsRead(
  weeklyWorkId: string,
  userId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("it_weekly_work_reads").upsert(
      {
        weekly_work_id: weeklyWorkId,
        user_id: userId,
        read_at: new Date().toISOString(),
      },
      { onConflict: "weekly_work_id,user_id" },
    );

    if (error) {
      return { error: formatSupabaseNetworkError(error.message) };
    }

    return { error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "읽음 처리에 실패했습니다.";
    return { error: formatSupabaseNetworkError(message) };
  }
}

async function loadUnreadContext(session: SessionUser) {
  const supabase = createServerClient();

  let workQuery = supabase.from("it_weekly_work").select("id, user_id");

  if (session.role === "member") {
    workQuery = workQuery.eq("user_id", session.id);
  } else if (session.role === "admin") {
    workQuery = workQuery.neq("user_id", session.id);
  } else {
    return {
      workOwnerMap: {} as Record<string, string>,
      comments: [] as CommentRow[],
      reads: [],
    };
  }

  const { data: workRows, error: workError } = await workQuery;

  if (workError) {
    throw new Error(workError.message);
  }

  const works = (workRows ?? []) as WorkRow[];
  const workIds = works.map((item) => item.id);

  if (workIds.length === 0) {
    return {
      workOwnerMap: {} as Record<string, string>,
      comments: [] as CommentRow[],
      reads: [],
    };
  }

  const workOwnerMap = Object.fromEntries(
    works.map((item) => [item.id, item.user_id]),
  );

  const { data: comments, error: commentError } = await supabase
    .from("it_weekly_work_comments")
    .select("id, weekly_work_id, parent_id, author_id, content, status, created_at")
    .in("weekly_work_id", workIds);

  if (commentError) {
    throw new Error(commentError.message);
  }

  const { data: reads, error: readError } = await supabase
    .from("it_weekly_work_reads")
    .select("weekly_work_id, read_at")
    .eq("user_id", session.id)
    .in("weekly_work_id", workIds);

  if (readError) {
    throw new Error(readError.message);
  }

  return {
    workOwnerMap,
    comments: (comments ?? []) as CommentRow[],
    reads: reads ?? [],
  };
}

export async function getUnreadWeeklyWorkCommentCount(
  session: SessionUser,
): Promise<FetchResult<number>> {
  if (!isSupabaseConfigured()) {
    return { data: 0, error: null };
  }

  if (session.role === "viewer") {
    return { data: 0, error: null };
  }

  try {
    const { workOwnerMap, comments, reads } = await loadUnreadContext(session);

    if (comments.length === 0) {
      return { data: 0, error: null };
    }

    const readMap = Object.fromEntries(
      reads.map((row) => [row.weekly_work_id as string, row.read_at as string]),
    );

    const unreadCount = comments.filter((comment) => {
      const workOwnerId = workOwnerMap[comment.weekly_work_id];
      if (!workOwnerId) {
        return false;
      }
      return isUnreadForViewer(
        comment,
        workOwnerId,
        session.role,
        readMap[comment.weekly_work_id],
      );
    }).length;

    return { data: unreadCount, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "알림 조회에 실패했습니다.";
    return { data: 0, error: formatSupabaseNetworkError(message) };
  }
}

export async function getUnreadWeeklyWorkSummaries(
  session: SessionUser,
): Promise<FetchResult<WeeklyWorkUnreadSummary[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  if (session.role === "viewer") {
    return { data: [], error: null };
  }

  try {
    const { workOwnerMap, comments, reads } = await loadUnreadContext(session);

    const readMap = Object.fromEntries(
      reads.map((row) => [row.weekly_work_id as string, row.read_at as string]),
    );

    const counts = new Map<string, number>();

    for (const comment of comments) {
      const workId = comment.weekly_work_id;
      const workOwnerId = workOwnerMap[workId];
      if (!workOwnerId) {
        continue;
      }

      const isUnread = isUnreadForViewer(
        comment,
        workOwnerId,
        session.role,
        readMap[workId],
      );

      if (isUnread) {
        counts.set(workId, (counts.get(workId) ?? 0) + 1);
      }
    }

    return {
      data: Array.from(counts.entries()).map(([weekly_work_id, unread_count]) => ({
        weekly_work_id,
        unread_count,
      })),
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "알림 조회에 실패했습니다.";
    return { data: [], error: formatSupabaseNetworkError(message) };
  }
}
