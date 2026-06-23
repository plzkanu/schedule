import type { ProjectPriority, ProjectStatus } from "./project-types";

export type TechCategory =
  | "AI"
  | "클라우드"
  | "개발플랫폼"
  | "데이터"
  | "보안"
  | "업무자동화"
  | "기타";

export type TechMaturity =
  | "탐색"
  | "학습"
  | "파일럿"
  | "확산"
  | "내재화완료";

export type TechStatus = ProjectStatus;
export type TechPriority = ProjectPriority;

export const TECH_CATEGORIES: TechCategory[] = [
  "AI",
  "클라우드",
  "개발플랫폼",
  "데이터",
  "보안",
  "업무자동화",
  "기타",
];

export const TECH_MATURITIES: TechMaturity[] = [
  "탐색",
  "학습",
  "파일럿",
  "확산",
  "내재화완료",
];

export const TECH_STATUSES: TechStatus[] = [
  "계획",
  "진행중",
  "보류",
  "완료",
  "지연",
];

export const TECH_PRIORITIES: TechPriority[] = ["상", "중", "하"];

export const CATEGORY_COLORS: Record<
  TechCategory,
  { bg: string; text: string; border: string }
> = {
  AI: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  클라우드: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  개발플랫폼: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  데이터: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  보안: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  업무자동화: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  기타: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
};

export const MATURITY_COLORS: Record<
  TechMaturity,
  { bg: string; text: string; border: string }
> = {
  탐색: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  학습: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  파일럿: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" },
  확산: { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-200" },
  내재화완료: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
};

export const CHART_MATURITY_COLORS: Record<TechMaturity, string> = {
  탐색: "#94a3b8",
  학습: "#38bdf8",
  파일럿: "#f59e0b",
  확산: "#009ada",
  내재화완료: "#22c55e",
};

export const CHART_CATEGORY_COLORS: Record<TechCategory, string> = {
  AI: "#8b5cf6",
  클라우드: "#0ea5e9",
  개발플랫폼: "#3b82f6",
  데이터: "#10b981",
  보안: "#ef4444",
  업무자동화: "#f59e0b",
  기타: "#64748b",
};

export interface TechCapability {
  id: string;
  name: string;
  description: string | null;
  category: TechCategory;
  maturity: TechMaturity;
  status: TechStatus;
  priority: TechPriority;
  start_date: string;
  target_date: string;
  progress: number;
  owner_id: string | null;
  department: string | null;
  use_cases: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TechCapabilityInput {
  name: string;
  description?: string | null;
  category: TechCategory;
  maturity: TechMaturity;
  status: TechStatus;
  priority: TechPriority;
  start_date: string;
  target_date: string;
  progress: number;
  owner_id?: string | null;
  department?: string | null;
  use_cases?: string | null;
  notes?: string | null;
}

export interface TechCapabilityFilters {
  category?: TechCategory;
  maturity?: TechMaturity;
  status?: TechStatus;
  priority?: TechPriority;
  owner_id?: string;
  search?: string;
}
