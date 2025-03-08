import { AIUsageType, Plan } from "@prisma/client";

type CreditType = "article" | "regular";

type PlanCredits = Record<
  Plan,
  {
    article: number;
    regular: number;
  }
>;

type CreditsCost = {
  action: AIUsageType;
  type: CreditType;
  cost: number;
};

export const INFINITY = 999999;

// Credits allocated per plan per billing period
export const creditsPerPlan: PlanCredits = {
  standard: {
    article: 20,
    regular: 50,
  },
  premium: {
    article: 50,
    regular: 200,
  },
  executive: {
    article: 150,
    regular: 1000,
  },
};

// Cost in credits for each AI operation
export const creditCosts: CreditsCost[] = [
  {
    action: "generateArticles",
    type: "article",
    cost: 3,
  },
  {
    action: "generateNotes",
    type: "regular",
    cost: 3,
  },
  {
    action: "improvementArticle",
    type: "article",
    cost: 1,
  },
];
