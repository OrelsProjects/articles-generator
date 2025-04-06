import prisma from "@/app/api/_db/db";

export async function getSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      OR: [
        {
          status: "active",
        },
        {
          status: "trialing",
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return subscription;
}
