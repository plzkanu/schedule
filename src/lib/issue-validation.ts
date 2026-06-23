import {
  ISSUE_SEVERITIES,
  ISSUE_STATUSES,
  type ProjectIssueInput,
  type IssueSeverity,
  type IssueStatus,
} from "./issue-types";

export function validateIssueInput(input: ProjectIssueInput): string | null {
  if (!input.title?.trim()) {
    return "이슈 제목을 입력해 주세요.";
  }
  if (input.title.trim().length > 200) {
    return "이슈 제목은 200자 이하여야 합니다.";
  }
  if (!ISSUE_SEVERITIES.includes(input.severity)) {
    return "유효하지 않은 심각도입니다.";
  }
  if (!ISSUE_STATUSES.includes(input.status)) {
    return "유효하지 않은 상태입니다.";
  }
  if (!input.occurred_date?.trim()) {
    return "발생일을 입력해 주세요.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.occurred_date)) {
    return "발생일 형식이 올바르지 않습니다.";
  }
  return null;
}

export function normalizeIssueInput(
  input: ProjectIssueInput,
): Omit<ProjectIssueInput, "title"> & { title: string } {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    severity: input.severity as IssueSeverity,
    status: input.status as IssueStatus,
    reporter_id: input.reporter_id?.trim() || null,
    assignee_id: input.assignee_id?.trim() || null,
    occurred_date: input.occurred_date,
    resolution: input.resolution?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}
