import type { SessionUser } from "./types";
import type { UserScheduleEntry, UserScheduleFilters } from "./user-schedule-types";

function isItTeamMember(session: SessionUser) {
  return (
    session.role === "admin" ||
    session.role === "member" ||
    session.role === "viewer"
  );
}

export function scopeUserScheduleFilters(
  session: SessionUser,
  filters: UserScheduleFilters,
): UserScheduleFilters {
  if (isItTeamMember(session)) {
    return filters;
  }
  return { ...filters, user_id: session.id };
}

export function canViewUserScheduleEntry(
  session: SessionUser,
  entry: UserScheduleEntry,
): boolean {
  void entry;
  return isItTeamMember(session);
}

export function canModifyUserScheduleEntry(
  session: SessionUser,
  entry: UserScheduleEntry,
): boolean {
  if (session.role === "viewer") {
    return false;
  }
  if (session.role === "admin") {
    return true;
  }
  return entry.user_id === session.id;
}

export function resolveScheduleTargetUserId(
  session: SessionUser,
  requestedUserId?: string,
): string {
  if (session.role === "member") {
    return session.id;
  }
  return requestedUserId?.trim() || session.id;
}
