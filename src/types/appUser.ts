import { Plan } from "@prisma/client";

export default interface AppUser {
  email: string;
  userId: string;
  image?: string | null;
  meta?: { plan: Plan };
  displayName?: string | null;
}
