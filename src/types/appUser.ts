import { Plan, FeatureFlag } from "@prisma/client";

export interface AppUserMeta {
  plan: Plan | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  hadSubscription: boolean;
  featureFlags: FeatureFlag[];
  isAdmin: boolean;
}

export default interface AppUser {
  email: string;
  userId: string;
  image?: string | null;
  meta?: AppUserMeta;
  displayName?: string | null;
}
