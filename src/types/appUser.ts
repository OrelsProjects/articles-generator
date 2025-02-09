import { UserMetadata } from "@prisma/client";

export type Plan = Pick<UserMetadata, "plan">;

export default interface AppUser {
  email: string;
  userId: string;
  image?: string | null;
  meta?: Plan;
  displayName?: string | null;
}
