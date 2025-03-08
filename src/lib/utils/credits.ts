import prisma from "@/app/api/_db/db";
import { creditCosts } from "@/lib/plans-consts";
import { AIUsageType } from "@prisma/client";

export async function canUseAI(userId: string, usageType: AIUsageType) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "active",
    },
  });

  if (!subscription) {
    return false;
  }

  const cost = creditCosts.find((cost) => cost.action === usageType);
  if (!cost) {
    return false;
  }

  let creditsLeft = -1;
  if (cost.type === "article") {
    creditsLeft = subscription.creditsPerPeriodArticle;
  } else if (cost.type === "regular") {
    creditsLeft = subscription.creditsPerPeriodRegular;
  }

  if (creditsLeft < cost.cost) {
    return false;
  }

  return true;
}

export async function useCredits(userId: string, usageType: AIUsageType) {}
