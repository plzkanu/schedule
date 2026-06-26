export const WEEKLY_WORK_RESPONSE_STATUSES = [
  "review",
  "in_progress",
  "completed",
  "rejected",
] as const;

export type WeeklyWorkResponseStatus =
  (typeof WEEKLY_WORK_RESPONSE_STATUSES)[number];

export const WEEKLY_WORK_RESPONSE_STATUS_LABELS: Record<
  WeeklyWorkResponseStatus,
  string
> = {
  review: "검토",
  in_progress: "진행",
  completed: "완료",
  rejected: "반려",
};

export interface WeeklyWorkComment {
  id: string;
  weekly_work_id: string;
  parent_id: string | null;
  author_id: string;
  content: string;
  status: WeeklyWorkResponseStatus | null;
  created_at: string;
}

export interface WeeklyWorkCommentNode extends WeeklyWorkComment {
  replies: WeeklyWorkCommentNode[];
}

export interface WeeklyWorkCommentInput {
  content?: string;
  status?: WeeklyWorkResponseStatus;
  parent_id?: string | null;
}

export interface WeeklyWorkUnreadSummary {
  weekly_work_id: string;
  unread_count: number;
}

export function isWeeklyWorkOwnerComment(
  comment: Pick<WeeklyWorkComment, "author_id">,
  workOwnerId: string,
): boolean {
  return comment.author_id === workOwnerId;
}

/** @deprecated use isWeeklyWorkOwnerComment */
export function isWeeklyWorkUserResponse(
  comment: Pick<WeeklyWorkComment, "author_id" | "status">,
  workOwnerId: string,
): boolean {
  return isWeeklyWorkOwnerComment(comment, workOwnerId);
}

export function buildCommentTree(
  comments: WeeklyWorkComment[],
): WeeklyWorkCommentNode[] {
  const nodes = new Map<string, WeeklyWorkCommentNode>();

  for (const comment of comments) {
    nodes.set(comment.id, { ...comment, replies: [] });
  }

  const roots: WeeklyWorkCommentNode[] = [];

  for (const comment of comments) {
    const node = nodes.get(comment.id);
    if (!node) {
      continue;
    }

    if (comment.parent_id && nodes.has(comment.parent_id)) {
      nodes.get(comment.parent_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
