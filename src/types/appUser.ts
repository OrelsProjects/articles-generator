import { Plan, FeatureFlag } from "@prisma/client";

export interface AppUserMeta {
  plan: Plan | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  featureFlags: FeatureFlag[];
}

export default interface AppUser {
  email: string;
  userId: string;
  image?: string | null;
  meta?: AppUserMeta;
  displayName?: string | null;
}
