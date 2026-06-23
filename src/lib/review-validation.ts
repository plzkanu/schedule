import {
  REVIEW_CATEGORIES,
  REVIEW_PRIORITIES,
  REVIEW_STATUSES,
  type ReviewInput,
  type ReviewCategory,
  type ReviewPriority,
  type ReviewStatus,
} from "./review-types";

export function validateReviewInput(input: ReviewInput): string | null {
  if (!input.title?.trim()) {
    return "검토 제목을 입력해 주세요.";
  }
  if (input.title.trim().length > 200) {
    return "검토 제목은 200자 이하여야 합니다.";
  }
  if (!REVIEW_CATEGORIES.includes(input.category)) {
    return "유효하지 않은 분류입니다.";
  }
  if (!REVIEW_STATUSES.includes(input.status)) {
    return "유효하지 않은 상태입니다.";
  }
  if (!REVIEW_PRIORITIES.includes(input.priority)) {
    return "유효하지 않은 우선순위입니다.";
  }
  if (!input.requested_date?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(input.requested_date)) {
    return "요청일 형식이 올바르지 않습니다.";
  }
  if (!input.target_date?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(input.target_date)) {
    return "검토 목표일 형식이 올바르지 않습니다.";
  }
  if (input.requested_date > input.target_date) {
    return "검토 목표일은 요청일 이후여야 합니다.";
  }
  return null;
}

export function normalizeReviewInput(input: ReviewInput): ReviewInput {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    category: input.category,
    status: input.status,
    priority: input.priority,
    request_department: input.request_department?.trim() || null,
    requester_id: input.requester_id?.trim() || null,
    reviewer_id: input.reviewer_id?.trim() || null,
    requested_date: input.requested_date,
    target_date: input.target_date,
    review_summary: input.review_summary?.trim() || null,
    scope: input.scope?.trim() || null,
    notes: input.notes?.trim() || null,
    project_id: input.project_id?.trim() || null,
  };
}
