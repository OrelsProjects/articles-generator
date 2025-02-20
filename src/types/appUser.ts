import { Plan } from "@prisma/client";

export interface AppUserMeta {
  plan: Plan;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export default interface AppUser {
  email: string;
  userId: string;
  image?: string | null;
  meta?: AppUserMeta;
  displayName?: string | null;
}
