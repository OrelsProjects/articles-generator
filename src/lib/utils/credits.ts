import { prisma } from "@/lib/prisma";
import { getActiveSubscription } from "@/lib/dal/subscription";
import { creditCosts, creditsPerPlan } from "@/lib/plans-consts";
import { getNextRefillDate } from "@/lib/services/creditService";
import loggerServer from "@/loggerServer";
import { AIUsageType, Plan, Subscription } from "@prisma/client";

type AIUsageErrors = "NO-SUBSCRIPTION" | "USAGE-UNKNOWN" | "NOT-ENOUGH-CREDITS";

const ErrorStatus: Record<AIUsageErrors, number> = {
  "NO-SUBSCRIPTION": 403,
  "USAGE-UNKNOWN": 404,
  "NOT-ENOUGH-CREDITS": 402,
};

export async function canUseAI(
  userId: string,
  usageType: AIUsageType,
  presetCredits?: number,
): Promise<{ result: boolean; status: number; nextRefill?: Date }> {
  const subscription = await getActiveSubscription(userId);

  if (!subscription) {
    loggerServer.error("Failed to check canUseAI due to subscription null", {
      userId,
    });
    return {
      result: false,
      status: ErrorStatus["NO-SUBSCRIPTION"],
    };
  }

  const cost = presetCredits || creditCosts[usageType];
  if (!cost) {
    loggerServer.error(
      "Failed to check canUseAI due to no cost for: " + usageType,
      {
        userId,
      },
    );

    return {
      result: false,
      status: ErrorStatus["USAGE-UNKNOWN"],
    };
  }

  let creditsLeft = subscription.creditsRemaining;

  if (creditsLeft < cost) {
    const nextRefill = getNextRefillDate(subscription.lastCreditReset);
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
  presetCredits?: number,
): Promise<{ creditsUsed: number; creditsRemaining: number }> {
  const subscription = await getActiveSubscription(userId);

  if (!subscription) {
    loggerServer.error("Subscription not found when trying to use credits", {
      userId,
    });
    return { creditsUsed: 0, creditsRemaining: 0 };
  }

  const cost = presetCredits || creditCosts[usageType];

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

export async function undoUseCredits(
  userId: string,
  usageType: AIUsageType,
  presetCredits?: number,
) {
  try {
    const subscription = await getActiveSubscription(userId);

    if (!subscription) {
      loggerServer.error("Subscription not found when trying to use credits", {
        userId,
      });
      return { creditsUsed: 0, creditsRemaining: 0 };
    }

    const cost = presetCredits || creditCosts[usageType];

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { creditsRemaining: subscription.creditsRemaining + cost },
    });
  } catch (error) {
    loggerServer.error("Error undoing use credits", {
      error,
      userId,
    });
  }
}

export async function calculateNewPlanCreditsLeft(
  userId: string,
  newPlan: Plan,
  subscription?: Subscription,
): Promise<{ creditsLeft: number; creditsForPlan: number }> {
  const newCreditsForPlan = creditsPerPlan[newPlan];
  const userSubscription =
    subscription || (await getActiveSubscription(userId));
  if (!userSubscription) {
    throw new Error("Subscription not found in calculateNewPlanCreditsLeft");
  }

  let oldCreditsPerPeriod = userSubscription.creditsPerPeriod;
  const creditsLeft = userSubscription.creditsRemaining;

  let creditsUsed = Math.max(oldCreditsPerPeriod - creditsLeft, 0);

  const newCreditsLeft = newCreditsForPlan - creditsUsed;
  return { creditsLeft: newCreditsLeft, creditsForPlan: newCreditsForPlan };
}
