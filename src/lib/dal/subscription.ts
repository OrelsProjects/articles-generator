import { prisma } from "@/lib/prisma";

const OR = [
  {
    status: "active",
  },
  {
    status: "trialing",
  },
];

export async function getActiveSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      OR,
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
      OR,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return subscription;
}
