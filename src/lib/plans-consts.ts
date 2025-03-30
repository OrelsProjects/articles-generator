import { AIUsageType, FeatureFlag, Plan, UserMetadata } from "@prisma/client";

type PlanCredits = Record<Plan, number>;

type CreditsCost = Record<AIUsageType, number>;

export const INFINITY = 999999;

// Credits allocated per plan per billing period
export const creditsPerPlan: PlanCredits = {
  hobbyist: 50,
  standard: 200,
  premium: 350,
};

export const featureFlagsPerPlan: Record<Plan, FeatureFlag[]> = {
  hobbyist: [FeatureFlag.instantPost],
  standard: [
    FeatureFlag.articles,
    FeatureFlag.instantPost,
    FeatureFlag.advancedGPT,
    FeatureFlag.advancedFiltering,
  ],
  premium: [
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

export const canUseFeature = (userMetadata: UserMetadata, featureFlag: FeatureFlag) => {
  return userMetadata.featureFlags.includes(featureFlag);
};
