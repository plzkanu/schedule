import type { CreateUserInput, UpdateUserInput } from "@/lib/user-types";
import type { UserRole } from "@/lib/types";

const VALID_ROLES: UserRole[] = ["admin", "member", "viewer"];
const LOGIN_ID_PATTERN = /^[a-zA-Z0-9_-]{2,32}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 전각 ＠(U+FF20) 등 @ 유사 문자를 ASCII @ 로 변환 */
export function normalizeEmailAddress(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/\uFF20/g, "@");
}

export function validateCreateUserInput(input: CreateUserInput): string | null {
  const id = input.id?.trim() ?? "";
  const name = input.name?.trim() ?? "";
  const email = normalizeEmailAddress(input.email ?? "");
  const password = input.password ?? "";

  if (!id) {
    return "아이디를 입력해 주세요.";
  }
  if (!LOGIN_ID_PATTERN.test(id)) {
    return "아이디는 2~32자의 영문, 숫자, _, - 만 사용할 수 있습니다.";
  }
  if (!name) {
    return "이름을 입력해 주세요.";
  }
  if (!email) {
    return "이메일을 입력해 주세요.";
  }
  if (!EMAIL_PATTERN.test(email)) {
    return "올바른 이메일 형식이 아닙니다.";
  }
  if (!password || password.length < 6) {
    return "비밀번호는 6자 이상이어야 합니다.";
  }
  if (!input.role || !VALID_ROLES.includes(input.role)) {
    return "올바른 역할이 아닙니다.";
  }

  return null;
}

export function validateUpdateUserInput(input: UpdateUserInput): string | null {
  if (
    input.name === undefined &&
    input.email === undefined &&
    input.password === undefined &&
    input.role === undefined &&
    input.department === undefined
  ) {
    return "변경할 항목을 입력해 주세요.";
  }

  if (input.name !== undefined && !input.name.trim()) {
    return "이름을 입력해 주세요.";
  }
  if (input.email !== undefined) {
    const email = normalizeEmailAddress(input.email);
    if (!email) {
      return "이메일을 입력해 주세요.";
    }
    if (!EMAIL_PATTERN.test(email)) {
      return "올바른 이메일 형식이 아닙니다.";
    }
  }
  if (input.password !== undefined && input.password !== "") {
    if (input.password.length < 6) {
      return "비밀번호는 6자 이상이어야 합니다.";
    }
  }
  if (input.role !== undefined && !VALID_ROLES.includes(input.role)) {
    return "올바른 역할이 아닙니다.";
  }

  return null;
}

export function normalizeCreateUserInput(input: CreateUserInput): CreateUserInput {
  return {
    id: input.id.trim(),
    name: input.name.trim(),
    email: normalizeEmailAddress(input.email),
    password: input.password,
    role: input.role,
    department: (input.department ?? "").trim(),
  };
}

export function normalizeUpdateUserInput(input: UpdateUserInput): UpdateUserInput {
  const normalized: UpdateUserInput = { ...input };

  if (input.name !== undefined) {
    normalized.name = input.name.trim();
  }
  if (input.email !== undefined) {
    normalized.email = normalizeEmailAddress(input.email);
  }
  if (input.department !== undefined) {
    normalized.department = input.department.trim();
  }
  if (input.password === "") {
    delete normalized.password;
  }

  return normalized;
}
