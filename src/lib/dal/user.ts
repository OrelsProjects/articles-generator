import prisma from "@/app/api/_db/db";
import { UserNotFoundError } from "@/types/errors/UserNotFoundError";

export async function getUserPlan(userId: string) {
  const user = await prisma.userMetadata.findUnique({
    where: { userId },
  });

  if (!user) {
    throw new UserNotFoundError("User not found");
  }

  return user.plan;
}
