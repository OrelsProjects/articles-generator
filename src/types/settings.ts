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
}

export interface SubscriptionInfo {
  cancelAt: Date | undefined;
}

export interface AllUsages {
  credits: CreditInfo;
}

export type CreditType = "article" | "regular";
