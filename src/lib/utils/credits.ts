import prisma from "@/app/api/_db/db";
import { creditCosts } from "@/lib/plans-consts";
import { getNextRefillDate } from "@/lib/services/creditService";
import loggerServer from "@/loggerServer";
import { AIUsageType } from "@prisma/client";

type AIUsageErrors = "NO-SUBSCRIPTION" | "USAGE-UNKNOWN" | "NOT-ENOUGH-CREDITS";

const ErrorStatus: Record<AIUsageErrors, number> = {
  "NO-SUBSCRIPTION": 403,
  "USAGE-UNKNOWN": 404,
  "NOT-ENOUGH-CREDITS": 402,
};

export async function canUseAI(
  userId: string,
  usageType: AIUsageType,
): Promise<{ result: boolean; status: number; nextRefill?: Date }> {
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
    loggerServer.error("Failed to check canUseAI due to subscription null");
    return {
      result: false,
      status: ErrorStatus["NO-SUBSCRIPTION"],
    };
  }

  const cost = creditCosts[usageType];
  if (!cost) {
    loggerServer.error(
      "Failed to check canUseAI due to no cost for: " + usageType,
    );

    return {
      result: false,
      status: ErrorStatus["USAGE-UNKNOWN"],
    };
  }

  let creditsLeft = subscription.creditsRemaining;

  const nextRefill = getNextRefillDate(subscription.lastCreditReset);

  if (creditsLeft < cost) {
    return {
      result: false,
      status: ErrorStatus["NOT-ENOUGH-CREDITS"],
      nextRefill,
    };
  }

  return {
    result: true,
    status: 200,
  };
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

export async function undoUseCredits(userId: string, usageType: AIUsageType) {
  try {
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

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { creditsRemaining: subscription.creditsRemaining + cost },
    });
  } catch (error) {
    loggerServer.error("Error undoing use credits", { error });
  }
}
