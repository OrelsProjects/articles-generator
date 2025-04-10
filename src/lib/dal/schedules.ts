import prisma from "@/app/api/_db/db";
import { ScheduledNote } from "@prisma/client";

export type CreateScheduledNote = Omit<
  ScheduledNote,
  "id" | "createdAt" | "updatedAt"
>;

export async function createSchedule(
  schedule: CreateScheduledNote,
): Promise<ScheduledNote> {
  const createdSchedule = await prisma.scheduledNote.create({
    data: schedule,
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

export async function deleteSchedule(scheduleName: string): Promise<void> {
  const latestSchedule = await prisma.scheduledNote.findFirst({
    where: {
      scheduleId: scheduleName,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  if (latestSchedule) {
    await prisma.scheduledNote.delete({
      where: { id: latestSchedule?.id },
    });
  }
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

