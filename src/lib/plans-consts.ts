import { AIUsageType, FeatureFlag, Plan } from "@prisma/client";

type PlanCredits = Record<Plan, number>;

type CreditsCost = Record<AIUsageType, number>;

export const INFINITY = 999999;

// Credits allocated per plan per billing period
export const creditsPerPlan: PlanCredits = {
  standard: 50,
  premium: 200,
  executive: 350,
};

export const featureFlagsPerPlan: Record<Plan, FeatureFlag[]> = {
  standard: [FeatureFlag.instantPost],
  premium: [
    FeatureFlag.articles,
    FeatureFlag.instantPost,
    FeatureFlag.advancedGPT,
    FeatureFlag.advancedFiltering,
  ],
  executive: [
    FeatureFlag.articles,
    FeatureFlag.instantPost,
    FeatureFlag.advancedGPT,
    FeatureFlag.advancedFiltering,
  ],
};

// Cost in credits for each AI operation
export const creditCosts: CreditsCost = {
  [AIUsageType.ideaGeneration]: 3,
  [AIUsageType.textEnhancement]: 1,
  [AIUsageType.titleOrSubtitleRefinement]: 1,
  [AIUsageType.notesGeneration]: 3,
};
