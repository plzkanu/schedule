import {
  differenceInCalendarDays,
  endOfMonth,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import type { Project, ProjectStatus } from "./project-types";
import { PROJECT_STATUSES, STATUS_HEX_COLORS } from "./project-types";

export interface ApproachingProject extends Project {
  dDay: number;
}

export interface DashboardData {
  totalProjects: number;
  inProgressProjects: number;
  completedProjects: number;
  dueWithin7Days: number;
  delayedProjects: number;
  averageProgress: number;
  completionRate: number;
  statusDistribution: { status: ProjectStatus; count: number }[];
  statusSummary: { status: ProjectStatus; count: number }[];
  ownerDistribution: { name: string; count: number }[];
  departmentDistribution: { department: string; count: number }[];
  approachingProjects: ApproachingProject[];
}

export function calculateProjectDDay(
  endDate: string,
  today = startOfDay(new Date()),
) {
  const end = startOfDay(parseISO(endDate));
  return differenceInCalendarDays(end, today);
}

export function getDDayBadgeVariant(
  dDay: number,
  status: ProjectStatus,
): "danger" | "warning" | "default" {
  if (status === "지연" || dDay < 0) {
    return "danger";
  }
  if (dDay <= 3) {
    return "warning";
  }
  return "default";
}

export function formatDDayLabel(dDay: number, status: ProjectStatus) {
  if (status === "지연" && dDay >= 0) {
    return dDay === 0 ? "D-Day" : `D-${dDay}`;
  }
  if (dDay < 0) {
    return `D+${Math.abs(dDay)}`;
  }
  if (dDay === 0) {
    return "D-Day";
  }
  return `D-${dDay}`;
}

export const CHART_STATUS_COLORS = STATUS_HEX_COLORS;

export function buildDashboardData(
  projects: Project[],
  ownerNames: Record<string, string>,
): DashboardData {
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const totalProjects = projects.length;
  const inProgressProjects = projects.filter(
    (project) => project.status === "진행중",
  ).length;
  const delayedProjects = projects.filter(
    (project) => project.status === "지연",
  ).length;
  const completedProjects = projects.filter(
    (project) => project.status === "완료",
  ).length;

  const averageProgress =
    totalProjects === 0
      ? 0
      : Math.round(
          projects.reduce((sum, project) => sum + project.progress, 0) /
            totalProjects,
        );

  const completionRate =
    totalProjects === 0
      ? 0
      : Math.round((completedProjects / totalProjects) * 100);

  const statusSummary = PROJECT_STATUSES.map((status) => ({
    status,
    count: projects.filter((project) => project.status === status).length,
  }));

  const dueWithin7Days = projects.filter((project) => {
    if (project.status === "완료") {
      return false;
    }
    const end = startOfDay(parseISO(project.end_date));
    if (end < monthStart || end > monthEnd) {
      return false;
    }
    const dDay = differenceInCalendarDays(end, today);
    return dDay >= 0 && dDay <= 7;
  }).length;

  const statusDistribution = PROJECT_STATUSES.map((status) => ({
    status,
    count: projects.filter((project) => project.status === status).length,
  })).filter((item) => item.count > 0);

  const ownerCounts = new Map<string, number>();
  for (const project of projects) {
    const name = project.owner_id
      ? (ownerNames[project.owner_id] ?? "담당자 미지정")
      : "미지정";
    ownerCounts.set(name, (ownerCounts.get(name) ?? 0) + 1);
  }
  const ownerDistribution = Array.from(ownerCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const departmentCounts = new Map<string, number>();
  for (const project of projects) {
    const department = project.department?.trim() || "미지정";
    departmentCounts.set(
      department,
      (departmentCounts.get(department) ?? 0) + 1,
    );
  }
  const departmentDistribution = Array.from(departmentCounts.entries())
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count);

  const approachingProjects = projects
    .filter((project) => {
      if (project.status === "완료") {
        return false;
      }
      const dDay = calculateProjectDDay(project.end_date, today);
      return project.status === "지연" || dDay <= 7;
    })
    .map((project) => ({
      ...project,
      dDay: calculateProjectDDay(project.end_date, today),
    }))
    .sort((a, b) => a.dDay - b.dDay);

  return {
    totalProjects,
    inProgressProjects,
    completedProjects,
    dueWithin7Days,
    delayedProjects,
    averageProgress,
    completionRate,
    statusDistribution,
    statusSummary,
    ownerDistribution,
    departmentDistribution,
    approachingProjects,
  };
}
