import prisma from "@/app/api/_db/db";
import { creditsPerPlan } from "@/lib/plans-consts";
import { Plan } from "@prisma/client";

/**
 * Checks if a user's credits need to be reset and resets them if necessary
 * @param userId The user's ID
 * @returns An object containing the updated credit amounts if reset, or the current amounts if no reset needed
 */
export const checkAndResetCredits = async (userId: string): Promise<{
  articleCredits: number;
  regularCredits: number;
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
        userMetadata: true,
      },
    });

    if (!user || !user.userMetadata?.[0]) {
      return { articleCredits: 0, regularCredits: 0 };
    }

    const subscription = user.Subscription?.[0];
    const userMetadata = user.userMetadata[0];
    
    // Get the plan for the user
    const planName = subscription?.plan || "standard";
    const planKey = planName.toLowerCase() as keyof typeof creditsPerPlan;
    
    // Get credit allocations for the plan
    const articleCreditsForPlan = creditsPerPlan[planKey]?.article || 0;
    const regularCreditsForPlan = creditsPerPlan[planKey]?.regular || 0;

    // Check if credits need to be reset
    let shouldReset = false;
    
    if (subscription) {
      // If there's a subscription, check if it's been a month since the last reset
      // or if we're in a new billing period
      const lastReset = subscription.lastCreditReset;
      const currentPeriodStart = subscription.currentPeriodStart;
      const now = new Date();
      
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
    } else if (
      !subscription && 
      (userMetadata.credits === 0)
    ) {
      // If there's no subscription but credits are depleted, reset them
      shouldReset = true;
    }

    // Reset credits if needed
    if (shouldReset) {
      // Update the subscription's credit information if it exists
      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            creditsPerPeriodArticle: articleCreditsForPlan,
            creditsPerPeriodRegular: regularCreditsForPlan,
            creditsRemainingArticle: articleCreditsForPlan,
            creditsRemainingRegular: regularCreditsForPlan,
            lastCreditReset: new Date(),
          },
        });
      }

      return {
        articleCredits: articleCreditsForPlan,
        regularCredits: regularCreditsForPlan
      };
    }

    // Return current credits if no reset was needed
    return {
      articleCredits: subscription?.creditsRemainingArticle || 0,
      regularCredits: subscription?.creditsRemainingRegular || 0
    };
  } catch (error) {
    console.error("Error checking/resetting credits:", error);
    return { articleCredits: 0, regularCredits: 0 };
  }
};
