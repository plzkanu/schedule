import {
  TECH_CATEGORIES,
  TECH_MATURITIES,
  TECH_PRIORITIES,
  TECH_STATUSES,
  type TechCapabilityInput,
  type TechCategory,
  type TechMaturity,
  type TechPriority,
  type TechStatus,
} from "./tech-capability-types";

export function validateTechCapabilityInput(
  input: Partial<TechCapabilityInput>,
): string | null {
  const name = input.name?.trim();
  if (!name) {
    return "기술명을 입력해 주세요.";
  }

  if (!input.start_date || !input.target_date) {
    return "시작일과 목표일을 입력해 주세요.";
  }

  if (input.start_date > input.target_date) {
    return "목표일은 시작일 이후여야 합니다.";
  }

  if (input.category && !TECH_CATEGORIES.includes(input.category as TechCategory)) {
    return "올바른 기술 분야가 아닙니다.";
  }

  if (input.maturity && !TECH_MATURITIES.includes(input.maturity as TechMaturity)) {
    return "올바른 성숙도 단계가 아닙니다.";
  }

  if (input.status && !TECH_STATUSES.includes(input.status as TechStatus)) {
    return "올바른 상태값이 아닙니다.";
  }

  if (input.priority && !TECH_PRIORITIES.includes(input.priority as TechPriority)) {
    return "올바른 우선순위가 아닙니다.";
  }

  if (
    input.progress !== undefined &&
    (input.progress < 0 || input.progress > 100)
  ) {
    return "진행률은 0~100 사이여야 합니다.";
  }

  return null;
}

export function normalizeTechCapabilityInput(input: TechCapabilityInput) {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    category: input.category,
    maturity: input.maturity,
    status: input.status,
    priority: input.priority,
    start_date: input.start_date,
    target_date: input.target_date,
    progress: input.progress,
    owner_id: input.owner_id?.trim() || null,
    department: input.department?.trim() || null,
    use_cases: input.use_cases?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}
