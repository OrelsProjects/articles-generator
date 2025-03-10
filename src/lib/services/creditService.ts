import prisma from "@/app/api/_db/db";
import { creditsPerPlan } from "@/lib/plans-consts";

/**
 * Checks if a user's credits need to be reset and resets them if necessary
 * @param userId The user's ID
 * @returns An object containing the updated credit amounts if reset, or the current amounts if no reset needed
 */
export const checkAndResetCredits = async (
  userId: string,
): Promise<{
  credits: number;
}> => {
  try {
    // Get the user with subscription and metadata
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Subscription: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return { credits: 0 };
    }

    const subscription = user.Subscription?.[0];

    // Check if credits need to be reset
    let shouldReset = false;

    if (!subscription) {
      return { credits: 0 };
    }

    // If there's a subscription, check if it's been a month since the last reset
    // or if we're in a new billing period
    const lastReset = subscription.lastCreditReset;
    const currentPeriodStart = subscription.currentPeriodStart;

    if (!lastReset) {
      // No previous reset, so we should reset
      shouldReset = true;
    } else if (currentPeriodStart > lastReset) {
      // We're in a new billing period
      shouldReset = true;
    } else {
      // Check if it's been a month since the last reset for monthly subscribers
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      if (lastReset < oneMonthAgo) {
        shouldReset = true;
      }
    }

    // Reset credits if needed
    if (shouldReset) {
      // Update the subscription's credit information if it exists
      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            creditsRemaining: subscription.creditsPerPeriod,
            lastCreditReset: new Date(),
          },
        });
      }

      return {
        credits: subscription.creditsPerPeriod,
      };
    }

    // Return current credits if no reset was needed
    return {
      credits: subscription.creditsRemaining,
    };
  } catch (error) {
    console.error("Error checking/resetting credits:", error);
    return { credits: 0 };
  }
};
