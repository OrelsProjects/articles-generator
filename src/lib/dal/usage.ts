import prisma from "@/app/api/_db/db";
import {
  creditsPerPlan,
  creditCosts,
  maxIdeasPerPlan,
  maxTextEnhancmentsPerPlan,
  maxTitleAndSubtitleRefinementsPerPlan,
} from "@/lib/plans-consts";
import { AIUsageType, Plan } from "@prisma/client";
import { AllUsages } from "@/types/settings";

// Returns usage information including credit status
export const getUsages = async (
  userId: string,
  plan: Plan,
): Promise<AllUsages> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Get user's current credit balance
  const userMetadata = await prisma.userMetadata.findUnique({
    where: { userId },
    select: { credits: true },
  });

  const credits = userMetadata?.credits || 0;
  const maxCredits = creditsPerPlan[plan];

  // Get detailed usage for reporting
  const usages = await prisma.aiUsage.findMany({
    where: { userId, createdAt: { gte: startOfDay } },
  });

  const usagesByType = usages.reduce(
    (acc, usage) => {
      acc[usage.type] = (acc[usage.type] || 0) + 1;
      return acc;
    },
    {} as Record<AIUsageType, number>,
  );

  // Calculate if user has enough credits for each operation type
  const hasEnoughForIdeaGeneration = credits >= creditCosts.ideaGeneration;
  const hasEnoughForTextEnhancement = credits >= creditCosts.textEnhancement;
  const hasEnoughForTitleRefinement = credits >= creditCosts.titleOrSubtitleRefinement;

  return {
    // Include credit information
    credits: {
      remaining: credits,
      total: maxCredits,
      used: maxCredits - credits,
    },
    // Keep legacy format for backward compatibility
    ideaGeneration: {
      count: usagesByType[AIUsageType.ideaGeneration] || 0,
      max: maxIdeasPerPlan[plan],
      didExceed: !hasEnoughForIdeaGeneration,
      creditCost: creditCosts.ideaGeneration,
    },
    textEnhancement: {
      count: usagesByType[AIUsageType.textEnhancement] || 0,
      max: maxTextEnhancmentsPerPlan[plan],
      didExceed: !hasEnoughForTextEnhancement,
      creditCost: creditCosts.textEnhancement,
    },
    titleOrSubtitleRefinement: {
      count: usagesByType[AIUsageType.titleOrSubtitleRefinement] || 0,
      max: maxTitleAndSubtitleRefinementsPerPlan[plan],
      didExceed: !hasEnoughForTitleRefinement,
      creditCost: creditCosts.titleOrSubtitleRefinement,
    },
  };
};

// Track AI usage and deduct credits
export const trackAIUsage = async (
  userId: string,
  plan: Plan,
  type: AIUsageType,
  usageName: string
): Promise<boolean> => {
  const creditCost = creditCosts[type];
  
  // Begin transaction to ensure atomic operations
  const result = await prisma.$transaction(async (tx) => {
    // Get current user credits
    const userMetadata = await tx.userMetadata.findUnique({
      where: { userId },
      select: { credits: true },
    });
    
    if (!userMetadata || userMetadata.credits < creditCost) {
      return false; // Not enough credits
    }
    
    // Deduct credits
    await tx.userMetadata.update({
      where: { userId },
      data: { credits: userMetadata.credits - creditCost },
    });
    
    // Record usage
    await tx.aiUsage.create({
      data: {
        userId,
        plan,
        type,
        usageName,
        credits: creditCost,
      },
    });
    
    return true; // Successfully tracked and deducted
  });
  
  return result;
};
