import prisma from "@/app/api/_db/db";

export async function getUserPlan(userId: string) {
  const user = await prisma.userMetadata.findUnique({
    where: { id: userId },
  });
  return user?.plan;
}
