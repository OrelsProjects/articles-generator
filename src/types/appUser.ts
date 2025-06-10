import { Plan, FeatureFlag } from "@prisma/client";

export interface AppUserMeta {
  plan: Plan | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  hadSubscription: boolean;
  interval: "month" | "year";
  featureFlags: FeatureFlag[];
  isAdmin: boolean;
  tempAuthorId: string | null;
  notesToGenerateCount: number;
  preferredLanguage: string | null;

  extensionVersion: string | null;
}

export default interface AppUser {
  email: string;
  userId: string;
  image?: string | null;
  meta?: AppUserMeta;
  displayName?: string | null;
}
