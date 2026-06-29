import type { UserRole } from "@/lib/types";

export interface CreateUserInput {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  department?: string;
}

export interface ItUserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  department: string;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}
