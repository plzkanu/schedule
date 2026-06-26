import type { SessionUser } from "./types";
import type { WeeklyWork, WeeklyWorkFilters } from "./weekly-work-types";

/** 관리자: 전체, IT팀원: 본인만, 경영진(viewer): 전체 조회 */
export function scopeWeeklyWorkFilters(
  session: SessionUser,
  filters: WeeklyWorkFilters = {},
): WeeklyWorkFilters {
  if (session.role === "admin" || session.role === "viewer") {
    return filters;
  }
  return { ...filters, user_id: session.id };
}

export function canViewWeeklyWork(
  session: SessionUser,
  item: WeeklyWork,
): boolean {
  if (session.role === "admin" || session.role === "viewer") {
    return true;
  }
  return item.user_id === session.id;
}

export function canModifyWeeklyWork(
  session: SessionUser,
  item: WeeklyWork,
): boolean {
  if (session.role === "viewer") {
    return false;
  }
  if (session.role === "admin") {
    return true;
  }
  return item.user_id === session.id;
}

/** 관리자만 타인 주간업무에 코멘트 가능 */
export function canCommentWeeklyWork(
  session: SessionUser,
  item: WeeklyWork,
): boolean {
  return session.role === "admin" && item.user_id !== session.id;
}

/** 담당자(작성자)만 관리자 코멘트에 상태·답변 등록 가능 */
export function canReplyWeeklyWork(
  session: SessionUser,
  item: WeeklyWork,
): boolean {
  if (session.role === "viewer") {
    return false;
  }
  return item.user_id === session.id;
}
