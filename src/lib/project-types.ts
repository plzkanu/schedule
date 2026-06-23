export type ProjectStatus = "계획" | "진행중" | "보류" | "완료" | "지연";
export type ProjectPriority = "상" | "중" | "하";

export const PROJECT_STATUSES: ProjectStatus[] = [
  "계획",
  "진행중",
  "보류",
  "완료",
  "지연",
];

export const PROJECT_PRIORITIES: ProjectPriority[] = ["상", "중", "하"];

export const STATUS_COLORS: Record<
  ProjectStatus,
  { bg: string; text: string; border: string }
> = {
  계획: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  진행중: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  보류: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-200",
  },
  완료: {
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-200",
  },
  지연: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
  },
};

/** 차트·Gantt 등 시각화용 HEX (진행중=파란색, 완료=녹색) */
export const STATUS_HEX_COLORS: Record<ProjectStatus, string> = {
  계획: "#94a3b8",
  진행중: "#3b82f6",
  보류: "#eab308",
  완료: "#22c55e",
  지연: "#ef4444",
};

export const GANTT_STATUS_HEX: Record<
  ProjectStatus,
  { backgroundColor: string; progressColor: string }
> = {
  계획: {
    backgroundColor: "#e2e8f0",
    progressColor: "#64748b",
  },
  진행중: {
    backgroundColor: "#93c5fd",
    progressColor: "#3b82f6",
  },
  보류: {
    backgroundColor: "#fcd34d",
    progressColor: "#b45309",
  },
  완료: {
    backgroundColor: "#86efac",
    progressColor: "#22c55e",
  },
  지연: {
    backgroundColor: "#f87171",
    progressColor: "#ef4444",
  },
};

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string;
  end_date: string;
  progress: number;
  owner_id: string | null;
  department: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectInput {
  name: string;
  description?: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string;
  end_date: string;
  progress: number;
  owner_id?: string | null;
  department?: string | null;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  priority?: ProjectPriority;
  owner_id?: string;
  progress_min?: number;
  progress_max?: number;
  search?: string;
}
