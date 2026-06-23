import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import type { CreateUserInput, ItUserRow, UpdateUserInput } from "@/lib/user-types";
import {
  normalizeCreateUserInput,
  normalizeEmailAddress,
  normalizeUpdateUserInput,
  validateCreateUserInput,
  validateUpdateUserInput,
} from "@/lib/user-validation";
import type { User, UserRole } from "./types";

const DEFAULT_ADMIN_ID = "admin";
const DEFAULT_ADMIN_EMAIL = "admin@soosan.com";
const DEFAULT_ADMIN_PASSWORD = "admin123";

const VALID_ROLES: UserRole[] = ["admin", "member", "viewer"];

function mapUser(row: ItUserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    department: row.department ?? "",
  };
}

function normalizeEmail(email: string) {
  return normalizeEmailAddress(email);
}

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase가 설정되지 않았습니다. 사용자 데이터는 Supabase it_users 테이블에 저장됩니다.",
    );
  }
}

async function seedDefaultAdminIfEmpty(): Promise<void> {
  const supabase = createServerClient();
  const { count, error: countError } = await supabase
    .from("it_users")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error(formatSupabaseNetworkError(countError.message));
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  const { error } = await supabase.from("it_users").insert({
    id: DEFAULT_ADMIN_ID,
    name: "시스템 관리자",
    email: DEFAULT_ADMIN_EMAIL,
    password_hash: passwordHash,
    role: "admin",
    department: "IT팀",
  });

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }
}

export async function getAllUsers(): Promise<User[]> {
  requireSupabase();
  await seedDefaultAdminIfEmpty();

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("it_users")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return (data ?? []).map((row) => mapUser(row as ItUserRow));
}

export async function findUserById(id: string): Promise<User | null> {
  requireSupabase();

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("it_users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return data ? mapUser(data as ItUserRow) : null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const normalized = normalizeEmail(email);
  const users = await getAllUsers();
  return users.find((user) => normalizeEmail(user.email) === normalized) ?? null;
}

export async function findUserByLoginId(loginId: string): Promise<User | null> {
  const trimmed = loginId.trim();
  if (!trimmed) {
    return null;
  }

  const byId = await findUserById(trimmed);
  if (byId) {
    return byId;
  }

  return findUserByEmail(trimmed);
}

export async function verifyUserCredentials(
  loginId: string,
  password: string,
): Promise<User | null> {
  const user = await findUserByLoginId(loginId);
  if (!user) {
    return null;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

async function assertUniqueEmail(email: string, excludeId?: string) {
  const existing = await findUserByEmail(email);
  if (existing && existing.id !== excludeId) {
    throw new Error("이미 사용 중인 이메일입니다.");
  }
}

async function assertUniqueId(id: string) {
  const existing = await findUserById(id);
  if (existing) {
    throw new Error("이미 사용 중인 아이디입니다.");
  }
}

export async function createUser(input: CreateUserInput): Promise<User> {
  requireSupabase();

  const normalized = normalizeCreateUserInput(input);
  const validationError = validateCreateUserInput(normalized);
  if (validationError) {
    throw new Error(validationError);
  }

  await assertUniqueId(normalized.id);
  await assertUniqueEmail(normalized.email);

  const passwordHash = await bcrypt.hash(normalized.password, 10);
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("it_users")
    .insert({
      id: normalized.id,
      name: normalized.name,
      email: normalized.email,
      password_hash: passwordHash,
      role: normalized.role,
      department: normalized.department ?? "",
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("아이디 또는 이메일이 이미 사용 중입니다.");
    }
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return mapUser(data as ItUserRow);
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
  actingUserId?: string,
): Promise<User> {
  requireSupabase();

  const normalized = normalizeUpdateUserInput(input);
  const validationError = validateUpdateUserInput(normalized);
  if (validationError) {
    throw new Error(validationError);
  }

  const existing = await findUserById(id);
  if (!existing) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  const nextRole = normalized.role ?? existing.role;

  if (normalized.role && !VALID_ROLES.includes(normalized.role)) {
    throw new Error("올바른 역할이 아닙니다.");
  }

  if (existing.role === "admin" && nextRole !== "admin") {
    const users = await getAllUsers();
    const adminCount = users.filter((item) => item.role === "admin").length;
    if (adminCount <= 1) {
      throw new Error("관리자가 한 명뿐이라 역할을 변경할 수 없습니다.");
    }
  }

  if (
    actingUserId &&
    id === actingUserId &&
    existing.role === "admin" &&
    nextRole !== "admin"
  ) {
    throw new Error("본인의 관리자 권한은 해제할 수 없습니다.");
  }

  if (normalized.email) {
    await assertUniqueEmail(normalized.email, id);
  }

  const patch: Record<string, string> = {
    updated_at: new Date().toISOString(),
  };

  if (normalized.name !== undefined) {
    patch.name = normalized.name;
  }
  if (normalized.email !== undefined) {
    patch.email = normalized.email;
  }
  if (normalized.role !== undefined) {
    patch.role = normalized.role;
  }
  if (normalized.department !== undefined) {
    patch.department = normalized.department;
  }
  if (normalized.password) {
    patch.password_hash = await bcrypt.hash(normalized.password, 10);
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("it_users")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("이미 사용 중인 이메일입니다.");
    }
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return mapUser(data as ItUserRow);
}

export async function deleteUser(
  id: string,
  actingUserId?: string,
): Promise<void> {
  requireSupabase();

  const existing = await findUserById(id);
  if (!existing) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  if (actingUserId && id === actingUserId) {
    throw new Error("본인 계정은 삭제할 수 없습니다.");
  }

  if (existing.role === "admin") {
    const users = await getAllUsers();
    const adminCount = users.filter((item) => item.role === "admin").length;
    if (adminCount <= 1) {
      throw new Error("관리자가 한 명뿐이라 삭제할 수 없습니다.");
    }
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("it_users").delete().eq("id", id);

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }
}

export function getDefaultAdminCredentials() {
  return {
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
  };
}
