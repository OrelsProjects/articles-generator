import { DefaultSession } from "next-auth";
import { AppUserMeta } from "@/types/appUser";
import { FeatureFlag } from "@prisma/client";
// Extend the SessionUser interface
declare module "next-auth" {
  interface SessionUser {
    id: string;
    publicationId?: string;
    meta?: AppUserMeta;
    featureFlags?: FeatureFlag[];
  }

  // Extend the Session interface
  interface Session {
    user: SessionUser & DefaultSession["user"];
  }
}
