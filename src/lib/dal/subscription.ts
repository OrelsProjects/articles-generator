import { prisma } from "@/lib/prisma";

export async function getActiveSubscription(userId: string) {
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

export async function getActiveSubscriptionByStripeSubId(stripeSubId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeSubId,
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
