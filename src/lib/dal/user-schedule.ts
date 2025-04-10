import prisma from "@/app/api/_db/db";
import { CreateUserSchedule } from "@/types/schedule";
import { AmPm } from "@prisma/client";

const defaultUserSchedule = [
  {
    hour: 12,
    minute: 34,
    ampm: "am",
  },
  {
    hour: 2,
    minute: 1,
    ampm: "am",
  },
  {
    hour: 4,
    minute: 19,
    ampm: "am",
  },
  {
    hour: 5,
    minute: 32,
    ampm: "am",
  },
  {
    hour: 7,
    minute: 0,
    ampm: "am",
  },
  {
    hour: 11,
    minute: 13,
    ampm: "pm",
  },
];
// Create all defaults, for all the days of the week
export async function createDefaultUserSchedule(userId: string) {
  const userSchedules: CreateUserSchedule[] = defaultUserSchedule.map(
    schedule => ({
      ...schedule,
      sunday: true,
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      ampm: schedule.ampm as AmPm,
    }),
  );

  const schedulesWithUserId = userSchedules.map(schedule => ({
    ...schedule,
    userId,
  }));

  // Upsert all, in one promise
  const upsertPromises = schedulesWithUserId.map(schedule =>
    prisma.userSchedule.upsert({
      where: {
        hour_minute_ampm_userId: {
          hour: schedule.hour,
          minute: schedule.minute,
          ampm: schedule.ampm,
          userId,
        },
      },
      update: schedule,
      create: schedule,
    }),
  );
  await Promise.all(upsertPromises);
  return schedulesWithUserId;
}
