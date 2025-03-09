import { AIUsageType } from "@prisma/client";

export interface AIUsageResponse<T> {
  responseBody?: {
    body: T;
    creditsUsed: number;
    creditsRemaining: number;
    type: AIUsageType;
  };
  error?: string;
}
