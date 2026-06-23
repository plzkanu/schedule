export type UserRole = "admin" | "member" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  department: string;
}

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

export function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department ?? "",
  };
}

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department ?? "",
  };
}
