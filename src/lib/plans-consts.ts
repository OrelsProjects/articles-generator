export const INFINITY = 999999;

// Credits allocated per plan per billing period
export const creditsPerPlan = {
  free: 10,
  pro: 250,
  superPro: 1000,
};

// Cost in credits for each AI operation
export const creditCosts = {
  ideaGeneration: 3,
  textEnhancement: 1,
  titleOrSubtitleRefinement: 1,
};

// Legacy constants - keeping for backward compatibility
export const maxIdeasPerPlan = {
  free: Math.floor(creditsPerPlan.free / creditCosts.ideaGeneration),
  pro: Math.floor(creditsPerPlan.pro / creditCosts.ideaGeneration),
  superPro: Math.floor(creditsPerPlan.superPro / creditCosts.ideaGeneration),
};

export const maxTextEnhancmentsPerPlan = {
  free: Math.floor(creditsPerPlan.free / creditCosts.textEnhancement),
  pro: INFINITY,
  superPro: INFINITY,
};

export const maxTitleAndSubtitleRefinementsPerPlan = {
  free: Math.floor(creditsPerPlan.free / creditCosts.titleOrSubtitleRefinement),
  pro: INFINITY,
  superPro: INFINITY,
};

export const textEditorTypePerPlan = {
  free: "AI-Powered",
  pro: "AI-Powered",
  superPro: "AI-Powered",
};

export const canUseSearchPerPlan = {
  free: false,
  pro: true,
  superPro: true,
};
