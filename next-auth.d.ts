import { DefaultSession } from "next-auth";
import { Plan } from "@/types/appUser";
// Extend the SessionUser interface
declare module "next-auth" {
  interface SessionUser {
    id: string;
    publicationId?: string;
    meta?: Plan;
  }

  // Extend the Session interface
  interface Session {
    user: SessionUser & DefaultSession["user"];
  }
}
