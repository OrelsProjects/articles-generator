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

export const maxNotesShceduledPerPlan = {
  hobbyist: 100,
  standard: INFINITY,
  premium: INFINITY,
};

export const featureFlagsPerPlan: Record<Plan, FeatureFlag[]> = {
  hobbyist: [FeatureFlag.instantPost],
  standard: [
    FeatureFlag.articles,
    FeatureFlag.instantPost,
    FeatureFlag.advancedGPT,
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
  [AIUsageType.analyze]: 10,
};

export const canUseFeature = (
  userMetadata: UserMetadata,
  featureFlag: FeatureFlag,
) => {
  return (
    userMetadata.isAdmin || userMetadata.featureFlags.includes(featureFlag)
  );
};

export const pricePerTokens = [
  {
    value: 10,
    label: "10",
    price: 4.99,
  },
  {
    value: 50,
    label: "50",
    price: 10.99,
  },
  {
    value: 100,
    label: "100",
    price: 18.99,
  },
  {
    value: 200,
    label: "200",
    price: 30.99,
  },
  {
    value: 300,
    label: "300",
    price: 40.99,
  },
  {
    value: 400,
    label: "400",
    price: 50.99,
  },
  {
    value: 500,
    label: "500",
    price: 59.99,
  },
];
