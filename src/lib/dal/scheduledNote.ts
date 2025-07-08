import { prisma } from "@/lib/prisma";
import { getCronExpressionFromDate } from "@/lib/utils/cron";
import { ScheduledNote } from "@prisma/client";

export type CreateScheduledNote =
  | Omit<ScheduledNote, "id" | "createdAt" | "updatedAt" | "isDeleted">
  | Omit<
      ScheduledNote,
      "id" | "createdAt" | "updatedAt" | "cronExpression" | "isDeleted"
    >;

export async function createSchedule(
  schedule: CreateScheduledNote,
): Promise<ScheduledNote> {
  let cronExpression = "";
  if ("cronExpression" in schedule) {
    cronExpression = schedule.cronExpression;
  } else {
    cronExpression = getCronExpressionFromDate(schedule.scheduledAt);
  }
  const createdSchedule = await prisma.scheduledNote.create({
    data: {
      ...schedule,
      cronExpression,
    },
  });
  return createdSchedule;
}

export async function getSchedulesByUserId(
  userId: string,
): Promise<ScheduledNote[]> {
  const schedules = await prisma.scheduledNote.findMany({
    where: {
      userId,
    },
  });
  return schedules;
}

export async function getLatestSchedule(
  noteId: string,
): Promise<ScheduledNote | null> {
  const latestSchedule = await prisma.scheduledNote.findFirst({
    where: {
      noteId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return latestSchedule;
}

export async function deleteLatestScheduleByNoteId(
  noteId: string,
): Promise<void> {
  const latestSchedule = await getLatestSchedule(noteId);
  if (latestSchedule) {
    await deleteScheduleById(latestSchedule.id);
  }
}

export async function deleteScheduleById(scheduleId: string): Promise<void> {
  await prisma.scheduledNote.update({
    where: { id: scheduleId },
    data: { isDeleted: true },
  });
}

export async function deleteScheduleByName(
  scheduleName: string,
): Promise<string | null> {
  const latestSchedule = await prisma.scheduledNote.findFirst({
    where: {
      scheduleId: scheduleName,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  if (latestSchedule) {
    await prisma.scheduledNote.update({
      where: { id: latestSchedule?.id },
      data: { isDeleted: true },
    });
    return latestSchedule.id;
  }
  return null;
}

export async function updateSchedule(
  scheduleId: string,
  schedule: Partial<ScheduledNote>,
): Promise<ScheduledNote> {
  const updatedSchedule = await prisma.scheduledNote.update({
    where: { id: scheduleId },
    data: schedule,
  });
  return updatedSchedule;
}

export async function getLatestScheduleForNote(
  noteId: string,
): Promise<ScheduledNote | null> {
  const latestSchedule = await prisma.scheduledNote.findFirst({
    where: { noteId },
    orderBy: { createdAt: "desc" },
  });
  return latestSchedule;
}
