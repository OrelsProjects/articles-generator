import prisma from "@/app/api/_db/db";
import { creditCosts } from "@/lib/plans-consts";
import loggerServer from "@/loggerServer";
import { AIUsageType } from "@prisma/client";

export async function canUseAI(userId: string, usageType: AIUsageType) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "active",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!subscription) {
    return false;
  }

  const cost = creditCosts[usageType];
  if (!cost) {
    return false;
  }

  let creditsLeft = subscription.creditsRemaining;

  if (creditsLeft < cost) {
    return false;
  }

  return true;
}

export async function useCredits(
  userId: string,
  usageType: AIUsageType,
): Promise<{ creditsUsed: number; creditsRemaining: number }> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "active",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!subscription) {
    loggerServer.error("Subscription not found when trying to use credits", {
      userId,
    });
    return { creditsUsed: 0, creditsRemaining: 0 };
  }

  const cost = creditCosts[usageType];

  if (!cost) {
    loggerServer.error("Cost not found when trying to use credits", {
      userId,
      usageType,
    });
    return { creditsUsed: 0, creditsRemaining: 0 };
  }

  const creditsRemaining = subscription.creditsRemaining - cost;
  const creditsUsed = cost;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { creditsRemaining },
  });

  return { creditsUsed, creditsRemaining };
}
