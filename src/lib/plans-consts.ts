import { AIUsageType, Plan } from "@prisma/client";

type PlanCredits = Record<Plan, number>;

type CreditsCost = Record<AIUsageType, number>;

export const INFINITY = 999999;

// Credits allocated per plan per billing period
export const creditsPerPlan: PlanCredits = {
  standard: 50,
  premium: 250,
  executive: 1000,
};

// Cost in credits for each AI operation
export const creditCosts: CreditsCost = {
  [AIUsageType.ideaGeneration]: 3,
  [AIUsageType.textEnhancement]: 1,
  [AIUsageType.titleOrSubtitleRefinement]: 1,
  [AIUsageType.notesGeneration]: 3,
};
