export const USER_SCHEDULE_ENTRY_TYPES = ["business_trip", "vacation"] as const;

export type UserScheduleEntryType = (typeof USER_SCHEDULE_ENTRY_TYPES)[number];

export interface UserScheduleEntry {
  id: string;
  user_id: string;
  schedule_date: string;
  entry_type: UserScheduleEntryType;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserScheduleEntryInput {
  schedule_date: string;
  schedule_end_date?: string;
  entry_type: UserScheduleEntryType;
  note?: string;
  user_id?: string;
}

export interface UserScheduleFilters {
  user_id?: string;
  year: number;
  month: number;
}

export const USER_SCHEDULE_ENTRY_LABELS: Record<UserScheduleEntryType, string> = {
  business_trip: "외근",
  vacation: "휴가",
};

export const USER_SCHEDULE_ENTRY_SHORT_LABELS: Record<UserScheduleEntryType, string> = {
  business_trip: "외",
  vacation: "휴",
};
