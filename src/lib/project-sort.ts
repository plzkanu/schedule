import type { Project } from "./project-types";
import type { ProjectStatus } from "./project-types";

/** 프로젝트 목록 기본 정렬: 진행중 → 지연 → 계획 → 보류 → 완료 */
export const PROJECT_LIST_STATUS_ORDER: Record<ProjectStatus, number> = {
  진행중: 0,
  지연: 1,
  계획: 2,
  보류: 3,
  완료: 4,
};

export function compareProjectsByStatusPriority(a: Project, b: Project): number {
  return (
    PROJECT_LIST_STATUS_ORDER[a.status] - PROJECT_LIST_STATUS_ORDER[b.status]
  );
}

export function sortProjectsForList(
  projects: Project[],
  secondary: (a: Project, b: Project) => number = (a, b) =>
    b.updated_at.localeCompare(a.updated_at),
): Project[] {
  return [...projects].sort((a, b) => {
    const statusDiff = compareProjectsByStatusPriority(a, b);
    if (statusDiff !== 0) {
      return statusDiff;
    }
    return secondary(a, b);
  });
}
