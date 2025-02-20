import prisma from "@/app/api/_db/db";
import { UserNotFoundError } from "@/types/errors/UserNotFoundError";

export async function getUserPlan(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
    },
    include: {
      user: true,
    },
  });

  if (!subscription) {
    throw new UserNotFoundError("User not found");
  }

  return subscription.plan;
}
