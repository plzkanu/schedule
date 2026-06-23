import type { ProjectPriority } from "./project-types";

export type ReviewCategory =
  | "시스템개발"
  | "인프라"
  | "업무개선"
  | "AI/데이터"
  | "보안"
  | "기타";

export type ReviewStatus =
  | "접수"
  | "검토중"
  | "보완요청"
  | "승인대기"
  | "보류"
  | "반려"
  | "프로젝트화";

export type ReviewPriority = ProjectPriority;

export const REVIEW_CATEGORIES: ReviewCategory[] = [
  "시스템개발",
  "인프라",
  "업무개선",
  "AI/데이터",
  "보안",
  "기타",
];

export const REVIEW_STATUSES: ReviewStatus[] = [
  "접수",
  "검토중",
  "보완요청",
  "승인대기",
  "보류",
  "반려",
  "프로젝트화",
];

export const REVIEW_PRIORITIES: ReviewPriority[] = ["상", "중", "하"];

export const REVIEW_STATUS_COLORS: Record<
  ReviewStatus,
  { bg: string; text: string; border: string }
> = {
  접수: {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  검토중: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  보완요청: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  승인대기: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
  },
  보류: {
    bg: "bg-yellow-50",
    text: "text-yellow-800",
    border: "border-yellow-200",
  },
  반려: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  프로젝트화: {
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-200",
  },
};

export const REVIEW_CATEGORY_COLORS: Record<
  ReviewCategory,
  { bg: string; text: string; border: string }
> = {
  시스템개발: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  인프라: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  업무개선: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "AI/데이터": { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  보안: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  기타: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
};

export interface Review {
  id: string;
  title: string;
  description: string | null;
  category: ReviewCategory;
  status: ReviewStatus;
  priority: ReviewPriority;
  request_department: string | null;
  requester_id: string | null;
  reviewer_id: string | null;
  requested_date: string;
  target_date: string;
  review_summary: string | null;
  scope: string | null;
  notes: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewInput {
  title: string;
  description?: string | null;
  category: ReviewCategory;
  status: ReviewStatus;
  priority: ReviewPriority;
  request_department?: string | null;
  requester_id?: string | null;
  reviewer_id?: string | null;
  requested_date: string;
  target_date: string;
  review_summary?: string | null;
  scope?: string | null;
  notes?: string | null;
  project_id?: string | null;
}

export interface ReviewFilters {
  category?: ReviewCategory;
  status?: ReviewStatus;
  priority?: ReviewPriority;
  reviewer_id?: string;
  search?: string;
}
