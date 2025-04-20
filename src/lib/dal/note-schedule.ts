import prisma from "@/app/api/_db/db";
import { getNoteById } from "@/lib/dal/note";
import { createSchedule, deleteSchedule } from "@/lib/dal/schedules";
import { getCronExpressionFromDate } from "@/lib/utils/cron";
import {
  createEventBridgeSchedule,
  deleteEventBridgeSchedule,
  getEventBridgeSchedule,
} from "@/lib/utils/event-bridge";
import { NoteStatus } from "@prisma/client";

export const buildScheduleName = (noteId: string) => {
  const env = process.env.NODE_ENV;
  const prefix = env === "production" ? "" : "dev-";
  return `${prefix}note-scheduled-${noteId}`;
};

export async function createScheduleForNote(
  userId: string,
  noteId: string,
  date: Date,
): Promise<void> {
  const note = await getNoteById(noteId);
  if (!note) {
    throw new Error("Note not found");
  }
  // const now = new Date();
  // if (now > date) {
  //   throw new Error("Date is in the past");
  // }
  const dateNoSeconds = new Date(date);
  dateNoSeconds.setSeconds(0);
  dateNoSeconds.setMilliseconds(0);
  const scheduleName = buildScheduleName(note.id);
  const cronExpression = getCronExpressionFromDate(dateNoSeconds);

  const existingSchedule = await getEventBridgeSchedule({ name: scheduleName });
  if (existingSchedule) {
    await deleteEventBridgeSchedule(scheduleName);
    await deleteSchedule(scheduleName);
  }

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
    scheduledAt: dateNoSeconds,
    scheduleId: scheduleName,
  });

  await prisma.note.update({
    where: {
      id: noteId,
    },
    data: {
      sentViaScheduleAt: null,
      status: "scheduled",
      scheduledTo: dateNoSeconds,
    },
  });
}

export async function deleteScheduleForNote(
  noteId: string,
  newStatus?: NoteStatus | "archived",
): Promise<void> {
  const note = await getNoteById(noteId);
  if (!note) {
    throw new Error("Note not found");
  }
  const scheduleName = buildScheduleName(note.id);
  const currentSchedule = await getEventBridgeSchedule({ name: scheduleName });
  if (currentSchedule) {
    await deleteEventBridgeSchedule(scheduleName);
  }
  await deleteSchedule(scheduleName);
  let data =
    newStatus === "archived" ? { isArchived: true } : { status: newStatus };
  if (newStatus) {
    await prisma.note.update({
      where: {
        id: noteId,
      },
      data: {
        ...data,
        scheduledTo: null,
      },
    });
  }
}
