import type { ProjectPriority } from "./project-types";

export type IssueSeverity = ProjectPriority;

export type IssueStatus = "신규" | "조치중" | "해결" | "보류";

export const ISSUE_STATUSES: IssueStatus[] = [
  "신규",
  "조치중",
  "해결",
  "보류",
];

export const ISSUE_SEVERITIES: IssueSeverity[] = ["상", "중", "하"];

export const ISSUE_STATUS_COLORS: Record<
  IssueStatus,
  { bg: string; text: string; border: string }
> = {
  신규: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  조치중: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  해결: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  보류: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
  },
};

export interface ProjectIssue {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  severity: IssueSeverity;
  status: IssueStatus;
  reporter_id: string | null;
  assignee_id: string | null;
  occurred_date: string;
  resolution: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectIssueInput {
  title: string;
  description?: string | null;
  severity: IssueSeverity;
  status: IssueStatus;
  reporter_id?: string | null;
  assignee_id?: string | null;
  occurred_date: string;
  resolution?: string | null;
  notes?: string | null;
}
