import type { ProjectStatus } from "./project-types";
import { GANTT_STATUS_HEX } from "./project-types";

export type TaskStatus = ProjectStatus;

export interface ItTask {
  id: string;
  project_id: string;
  parent_task_id: string | null;
  is_group: boolean;
  name: string;
  notes: string | null;
  assignee_id: string | null;
  start_date: string;
  end_date: string;
  status: TaskStatus;
  progress: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ItTaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
}

export interface TaskInput {
  name: string;
  notes?: string | null;
  assignee_id?: string | null;
  start_date: string;
  end_date: string;
  status: TaskStatus;
  progress: number;
  is_group?: boolean;
  parent_task_id?: string | null;
  dependency_ids?: string[];
  sort_order?: number;
}

export interface TaskWithDependencies extends ItTask {
  dependency_ids: string[];
}

export const GANTT_STATUS_STYLES = GANTT_STATUS_HEX;
