export interface Usage {
  count: number;
  max: number;
  didExceed: boolean;
  creditCost?: number;
}

export interface CreditInfo {
  remaining: number;
  total: number;
  used: number;
  
  articleCredits: {
    remaining: number;
    total: number;
    used: number;
  };
  regularCredits: {
    remaining: number;
    total: number;
    used: number;
  };
}

export interface AllUsages {
  ideaGeneration: Usage;
  textEnhancement: Usage;
  titleOrSubtitleRefinement: Usage;
  credits: CreditInfo;
}
