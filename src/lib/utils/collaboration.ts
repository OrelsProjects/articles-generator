import { format, addDays, startOfToday } from "date-fns";
import { NoteDraft } from "@/types/note";
import { UserSchedule } from "@/types/schedule";

/**
 * Generate an array of dates based on scheduled notes and minimum 28 days for collaboration page
 */
export const buildActiveDays = (scheduledNotes: NoteDraft[]): Date[] => {
  const today = startOfToday();
  const days = [];

  // Find the earliest and latest scheduled note dates
  let earliestScheduledDate = today;
  let latestScheduledDate = addDays(today, 28); // Default to 28 days ahead

  scheduledNotes.forEach(note => {
    if (note.scheduledTo) {
      const noteDate = new Date(note.scheduledTo);
      // Check for notes in the past
      if (noteDate < earliestScheduledDate) {
        earliestScheduledDate = noteDate;
      }
      // Check for notes far in the future
      if (noteDate > latestScheduledDate) {
        latestScheduledDate = noteDate;
      }
    }
  });

  // Ensure we show dates from the earliest scheduled note up to the furthest scheduled note
  let currentDay = earliestScheduledDate;

  while (currentDay <= latestScheduledDate) {
    days.push(currentDay);
    currentDay = addDays(currentDay, 1);
  }

  return days;
};

/**
 * Group collaboration notes by date for calendar display
 */
export const buildGroupedNotes = (scheduledNotes: NoteDraft[]): Record<string, NoteDraft[]> => {
  const grouped: Record<string, NoteDraft[]> = {};

  scheduledNotes.forEach(note => {
    if (note.scheduledTo) {
      const dateKey = format(new Date(note.scheduledTo), "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(note);
    }
  });

  // Sort notes within each group by time
  Object.keys(grouped).forEach(dateKey => {
    grouped[dateKey].sort((a, b) => {
      if (a.scheduledTo && b.scheduledTo) {
        return (
          new Date(a.scheduledTo).getTime() -
          new Date(b.scheduledTo).getTime()
        );
      }
      return 0;
    });
  });

  return grouped;
};

/**
 * Group client schedules by date for calendar display
 */
export const buildGroupedSchedules = (
  clientSchedules: UserSchedule[],
  activeDays: Date[]
): Record<string, UserSchedule[]> => {
  const grouped: Record<string, UserSchedule[]> = {};

  clientSchedules.forEach(schedule => {
    // Check each active day and add applicable schedules
    activeDays.forEach(day => {
      const dateKey = format(day, "yyyy-MM-dd");
      const dayOfWeek = format(day, "EEEE").toLowerCase();

      // Check if this schedule applies to this day of week
      if (schedule[dayOfWeek as keyof UserSchedule]) {
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(schedule);
      }
    });
  });

  // Sort schedules within each day by time
  Object.keys(grouped).forEach(dateKey => {
    grouped[dateKey].sort((a, b) => {
      const aHour = a.ampm === "pm" && a.hour !== 12 ? a.hour + 12 : a.hour;
      const bHour = b.ampm === "pm" && b.hour !== 12 ? b.hour + 12 : b.hour;

      if (aHour !== bHour) return aHour - bHour;
      return a.minute - b.minute;
    });
  });

  return grouped;
}; 