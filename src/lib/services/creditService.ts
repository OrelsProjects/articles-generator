import prisma from "@/app/api/_db/db";
import { differenceInMonths, addMonths } from "date-fns";

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
        subscription: {
          where: { OR: [{ status: "active" }, { status: "trialing" }] },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return { credits: 0 };
    }

    const subscription = user.subscription?.[0];

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
      const now = new Date();
      // Check if it's been a month since the last reset for monthly subscribers
      const monthsElapsed = differenceInMonths(now, lastReset);

      if (monthsElapsed >= 1) {
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

export function getNextRefillDate(lastCreditDate: Date): Date {
  // Convert input to Date object if it’s not already
  const lastDate = new Date(lastCreditDate);

  // Ensure the input is valid
  if (isNaN(lastDate.getTime())) {
    throw new Error("Invalid last_credit_date provided");
  }

  // Calculate the next refill date by adding 1 month
  const nextRefillDate = addMonths(lastDate, 1);

  return nextRefillDate;
}
