import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { FeatureFlag, Plan, PrismaClient, Subscription } from "@prisma/client";

import { getActiveSubscription } from "@/lib/dal/subscription";
import loggerServer from "@/loggerServer";
import { generatePrivateNewUserSignedUpEmail } from "@/lib/mail/templates";
import { sendMailSafe } from "@/lib/mail/mail";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  debug: process.env.NODE_ENV === "development",
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_AUTH_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      try {
        session.user.id = token.sub as string;
        const promises = [
          prisma.userMetadata.findUnique({
            where: {
              userId: token.sub as string,
            },
            select: {
              publicationId: true,
              featureFlags: true,
              isAdmin: true,
            },
          }),
          getActiveSubscription(token.sub as string),
        ];
        const [userMetadata, activeSubscription] = (await Promise.all(
          promises,
        )) as [
          {
            publicationId: string | null;
            featureFlags: FeatureFlag[];
            isAdmin: boolean;
          } | null,
          Subscription | null,
        ];

        session.user.meta = {
          plan: activeSubscription?.plan
            ? (activeSubscription.plan as Plan)
            : null,
          currentPeriodStart: activeSubscription?.currentPeriodStart || null,
          currentPeriodEnd: activeSubscription?.currentPeriodEnd || null,
          cancelAtPeriodEnd: activeSubscription?.cancelAtPeriodEnd || false,
          featureFlags: userMetadata?.featureFlags || [],
          hadSubscription: activeSubscription !== null,
          interval: activeSubscription?.interval || "month",
          isAdmin: userMetadata?.isAdmin || false,
        };
        session.user.publicationId = userMetadata?.publicationId || "";
        return session;
      } catch (error) {
        loggerServer.error("Error in session callback", {
          error,
        });
        throw error;
      }
    },
  },
  session: {
    strategy: "jwt", // This is the default value
  },
  secret: process.env.NEXTAUTH_SECRET,
  events: {
    createUser: async message => {
      try {
        await prisma.userMetadata.create({
          data: {
            userId: message.user.id,
          },
        });
        const emailTemplate = generatePrivateNewUserSignedUpEmail(
          message.user.name || undefined,
          message.user.email || undefined,
        );
        await sendMailSafe({
          to: "orelsmail@gmail.com",
          from: "support",
          subject: emailTemplate.subject,
          template: emailTemplate.body,
        });
      } catch (error: any) {
        await prisma.user.delete({
          where: {
            id: message.user.id,
          },
        });
        throw error;
      }
    },
  },
};
