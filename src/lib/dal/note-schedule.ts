import { getNoteById } from "@/lib/dal/note";
import { createSchedule } from "@/lib/dal/schedules";
import { getCronExpressionFromDate } from "@/lib/utils/cron";
import { createEventBridgeSchedule } from "@/lib/utils/event-bridge";

export async function createScheduleForNote(
  userId: string,
  noteId: string,
  date: Date,
): Promise<void> {
  const note = await getNoteById(noteId);
  if (!note) {
    throw new Error("Note not found");
  }
  const scheduleName = `note-scheduled-${note.id}`;
  const cronExpression = getCronExpressionFromDate(date);

  await createEventBridgeSchedule({
    name: scheduleName,
    scheduleExpression: cronExpression,
    endpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/user/notes/send`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-substack-schedule-secret": process.env
        .SUBSTACK_SCHEDULE_SECRET as string,
    },
    body: {
      noteId,
      userId,
    },
  });

  await createSchedule({
    noteId,
    cronExpression,
    userId,
    scheduledAt: date,
    scheduleId: scheduleName,
  });
}
