import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  type ProjectInput,
  type ProjectPriority,
  type ProjectStatus,
} from "./project-types";

export function validateProjectInput(
  input: Partial<ProjectInput>,
): string | null {
  const name = input.name?.trim();
  if (!name) {
    return "프로젝트명을 입력해 주세요.";
  }

  if (!input.start_date || !input.end_date) {
    return "시작일과 종료일을 입력해 주세요.";
  }

  if (input.start_date > input.end_date) {
    return "종료일은 시작일 이후여야 합니다.";
  }

  if (
    input.status &&
    !PROJECT_STATUSES.includes(input.status as ProjectStatus)
  ) {
    return "올바른 상태값이 아닙니다.";
  }

  if (
    input.priority &&
    !PROJECT_PRIORITIES.includes(input.priority as ProjectPriority)
  ) {
    return "올바른 우선순위값이 아닙니다.";
  }

  if (
    input.progress !== undefined &&
    (input.progress < 0 || input.progress > 100)
  ) {
    return "진행률은 0~100 사이여야 합니다.";
  }

  return null;
}

export function normalizeProjectInput(input: ProjectInput) {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    status: input.status,
    priority: input.priority,
    start_date: input.start_date,
    end_date: input.end_date,
    progress: input.progress,
    owner_id: input.owner_id?.trim() || null,
    department: input.department?.trim() || null,
  };
}
