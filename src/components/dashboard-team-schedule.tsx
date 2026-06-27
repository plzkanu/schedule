"use client";

import { UserScheduleCalendar } from "@/components/user-schedule-calendar";
import type { UserPublic } from "@/lib/types";

interface DashboardScheduleColumnProps {
  assignees: UserPublic[];
  currentUserId: string;
  canWrite: boolean;
}

export function DashboardScheduleColumn({
  assignees,
  currentUserId,
  canWrite,
}: DashboardScheduleColumnProps) {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <UserScheduleCalendar
        canWrite={canWrite}
        showUserFilter
        assignees={assignees}
        defaultUserId={currentUserId}
        currentUserId={currentUserId}
        compact
        fillHeight
        title="팀 외근 · 휴가"
      />
    </div>
  );
}
