import prisma from "@/app/api/_db/db";
import { creditsPerPlan } from "@/lib/plans-consts";
import { Plan } from "@prisma/client";

/**
 * Checks if a user's credits need to be reset and resets them if necessary
 * @param userId The user's ID
 * @returns The updated credit amount if reset, or the current amount if no reset needed
 */
export const checkAndResetCredits = async (userId: string): Promise<number> => {
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
        userMetadata: true,
      },
    });

    if (!user || !user.userMetadata?.[0]) {
      return 0;
    }

    const subscription = user.Subscription?.[0];
    const userMetadata = user.userMetadata[0];
    
    // Get the plan for the user
    const planName = subscription?.plan || "free";
    const planKey = planName.toLowerCase() as keyof typeof creditsPerPlan;
    const creditsForPlan = creditsPerPlan[planKey] || creditsPerPlan.free;

    // Check if credits need to be reset
    let shouldReset = false;
    
    if (subscription) {
      // If there's a subscription, check if it's been a month since the last reset
      const lastReset = subscription.lastCreditReset;
      if (!lastReset) {
        shouldReset = true;
      } else {
        const now = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        if (lastReset < oneMonthAgo) {
          shouldReset = true;
        }
      }
    } else if (userMetadata.credits === 0) {
      // If there's no subscription but credits are 0, reset them
      shouldReset = true;
    }

    // Reset credits if needed
    if (shouldReset) {
      // Update the user's credits
      await prisma.userMetadata.update({
        where: { id: userMetadata.id },
        data: { credits: creditsForPlan },
      });

      // Update the subscription's credit information if it exists
      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            creditsRemaining: creditsForPlan,
            creditsPerPeriod: creditsForPlan,
            lastCreditReset: new Date(),
          },
        });
      }

      return creditsForPlan;
    }

    // Return current credits if no reset was needed
    return userMetadata.credits;
  } catch (error) {
    console.error("Error checking/resetting credits:", error);
    return 0;
  }
}; 