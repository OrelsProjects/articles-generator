import { GetSchedulesResponse } from "@/types/useExtension.type";
import { NoteDraft } from "@/types/note";
import { UserSchedule as UserSchedulePrisma } from "@prisma/client";

export type UserSchedule = Omit<
  UserSchedulePrisma,
  "userId" | "createdAt" | "updatedAt"
>;

export type CreateUserSchedule = Omit<UserSchedule, "id">;

// Define discrepancy types
export interface Discrepancy {
  type: "missing_schedule" | "missing_alarm" | "time_mismatch" | "missing_note";
  noteId?: string;
  scheduleId?: string;
  details: string;
  note?: NoteDraft;
  schedule?: GetSchedulesResponse;
}

export type Days = {
  sunday: boolean;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
};

export const daysStringArrayToDaysObject = (days: string[]) => {
  return days.reduce(
    (acc: Days, day) => {
      acc[day as keyof Days] = true;
      return acc;
    },
    {
      sunday: false,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
    },
  );
};

export type ScheduleErrorMessage =
  | "FAILED_TO_CREATE_NOTE"
  | "GENERAL_ERROR"
  | "EMPTY_BODY"
  | "FAILED_TO_PREPARE_ATTACHMENTS"
  | "FAILED_TO_POST_TO_SUBSTACK";

export const ERROR_MESSAGES: Record<ScheduleErrorMessage, string> = {
  FAILED_TO_CREATE_NOTE: "Failed to create note",
  GENERAL_ERROR: "An error occurred",
  EMPTY_BODY: "Note body is empty",
  FAILED_TO_PREPARE_ATTACHMENTS: "Failed to prepare attachments",
  FAILED_TO_POST_TO_SUBSTACK: "Failed to post to Substack",
};
