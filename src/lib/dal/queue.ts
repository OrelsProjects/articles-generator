import { GhostwriterDAL } from "@/lib/dal/ghostwriter";
import { prisma } from "@/lib/prisma";
import { CreateUserSchedule, UserSchedule } from "@/types/schedule";

export async function createUserSchedule(
  schedule: CreateUserSchedule,
  userId: string,
) {
  const userSchedule = await prisma.userSchedule.create({
    data: {
      ...schedule,
      userId,
    },
  });
  return userSchedule;
}

export async function getUserSchedules(userId: string) {
  const userSchedulesResponse = await prisma.userSchedule.findMany({
    where: {
      userId,
    },
  });

  const userSchedules: UserSchedule[] = userSchedulesResponse.map(schedule => ({
    id: schedule.id,
    sunday: schedule.sunday,
    monday: schedule.monday,
    tuesday: schedule.tuesday,
    wednesday: schedule.wednesday,
    thursday: schedule.thursday,
    friday: schedule.friday,
    saturday: schedule.saturday,
    hour: schedule.hour,
    minute: schedule.minute,
    ampm: schedule.ampm,
    ghostwriterUserId: schedule.ghostwriterUserId,
  }));

  return userSchedules;
}

export async function updateUserSchedule(schedule: UserSchedule) {
  const { id, ghostwriterUserId, ...rest } = schedule;

  // Build data object
  const data: any = { ...rest };

  // Handle the ghostwriter relation
  if (ghostwriterUserId === null || ghostwriterUserId === undefined) {
    data.ghostwriter = { disconnect: true };
  } else {
    data.ghostwriter = { connect: { id: ghostwriterUserId } };
  }

  const updatedSchedule = await prisma.userSchedule.update({
    where: { id },
    data,
  });

  return updatedSchedule;
}


export const isOwnerOfSchedule = async (scheduleId: string, userId: string) => {
  const schedule = await prisma.userSchedule.findUnique({
    where: { id: scheduleId },
  });
  if (!schedule) {
    return false;
  }

  const isOwner = schedule.userId === userId;

  if (!isOwner) {
    const ownerId = schedule.userId;
    // Might be a ghostwriter
    const canRun = await GhostwriterDAL.canRunOnBehalfOf({
      ghostwriterUserId: userId,
      clientId: ownerId,
    });
    if (!canRun) {
      return false;
    }
  }
  return true;
};
