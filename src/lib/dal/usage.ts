import prisma from "@/app/api/_db/db";
import {
  maxIdeasPerPlan,
  maxTextEnhancmentsPerPlan,
  maxTitleAndSubtitleRefinementsPerPlan,
} from "@/lib/plans-consts";
import { AIUsageType, Plan } from "@prisma/client";
import { AllUsages } from "@/types/settings";

// Returns type to count
export const getUsages = async (
  userId: string,
  plan: Plan,
): Promise<AllUsages> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

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

  const maxIdeas = maxIdeasPerPlan[plan];
  const maxTextEnhancements = maxTextEnhancmentsPerPlan[plan];
  const maxTitleAndSubtitleRefinements =
    maxTitleAndSubtitleRefinementsPerPlan[plan];
  const didIdeasExceed = usagesByType[AIUsageType.ideaGeneration] >= maxIdeas;
  const didTextEnhancementsExceed =
    usagesByType[AIUsageType.textEnhancement] >= maxTextEnhancements;
  const didTitleAndSubtitleRefinementsExceed =
    usagesByType[AIUsageType.titleOrSubtitleRefinement] >=
    maxTitleAndSubtitleRefinements;

  return {
    ideaGeneration: {
      count: usagesByType[AIUsageType.ideaGeneration] || 0,
      max: maxIdeas,
      didExceed: didIdeasExceed,
    },
    textEnhancement: {
      count: usagesByType[AIUsageType.textEnhancement] || 0,
      max: maxTextEnhancements,
      didExceed: didTextEnhancementsExceed,
    },
    titleOrSubtitleRefinement: {
      count: usagesByType[AIUsageType.titleOrSubtitleRefinement] || 0,
      max: maxTitleAndSubtitleRefinements,
      didExceed: didTitleAndSubtitleRefinementsExceed,
    },
  };
};
