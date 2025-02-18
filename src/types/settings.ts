import { AIUsageType } from "@prisma/client";

export type Usage = {
  count: number;
  max: number;
  didExceed: boolean;
};

export type AllUsages = {
  [key in AIUsageType]: Usage;
};
