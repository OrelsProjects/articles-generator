import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { FeatureFlag, Plan, PrismaClient, Subscription } from "@prisma/client";

import { getActiveSubscription } from "@/lib/dal/subscription";
import loggerServer from "@/loggerServer";
import {
  generateMagicLinkEmail,
  generatePrivateNewUserSignedUpEmail,
} from "@/lib/mail/templates";
import { addSubscriber, addTagToEmail, sendMailSafe } from "@/lib/mail/mail";
import { getBylineByUserId } from "@/lib/dal/byline";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  debug: process.env.NODE_ENV === "development",
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_AUTH_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET as string,
      httpOptions: {
        timeout: process.env.NODE_ENV === "development" ? 15000 : 3500,
      },
    }),
    EmailProvider({
      from: "noreply@writestack.io",
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const magicLinkMail = generateMagicLinkEmail(identifier, url);
        const didSend = await sendMailSafe({
          to: identifier,
          from: "noreply",
          subject: magicLinkMail.subject,
          template: magicLinkMail.body,
          isMagicLink: true,
        });
        if (!didSend) {
          loggerServer.error("Failed to send magic link email", {
            identifier,
            url,
            provider,
            userId: "unknown",
          });
          throw new Error("Failed to send magic link email");
        }
      },
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
            include: {
              publication: {
                select: {
                  authorId: true,
                },
              },
            },
          }),
          getActiveSubscription(token.sub as string),
          prisma.user.findUnique({
            where: {
              id: token.sub as string,
            },
          }),
          prisma.extensionDetails.findUnique({
            where: {
              userId: token.sub as string,
            },
          }),
        ];
        const byline = await getBylineByUserId(token.sub as string);
        const [userMetadata, activeSubscription, user, extensionDetails] =
          (await Promise.all(promises)) as [
            {
              publicationId: string | null;
              featureFlags: FeatureFlag[];
              isAdmin: boolean;
              tempAuthorId: string | null;
              notesToGenerateCount: number;
              preferredLanguage: string;
              publication: {
                authorId: number | null;
              } | null;
            } | null,
            Subscription | null,
            {
              name: string | null;
              image: string | null;
            } | null,
            {
              versionInstalled: string | null;
            } | null,
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
          tempAuthorId: userMetadata?.tempAuthorId || null,
          notesToGenerateCount: userMetadata?.notesToGenerateCount || 3,
          preferredLanguage: userMetadata?.preferredLanguage || "en",
          extensionVersion: extensionDetails?.versionInstalled || null,
          author: {
            id: byline?.id || userMetadata?.publication?.authorId || 0,
            handle: byline?.handle || "",
            name: byline?.name || "",
            photoUrl: byline?.photoUrl || token.picture || "",
          },
        };
        session.user.name = user?.name || null;
        session.user.image = user?.image || null;
        session.user.publicationId = userMetadata?.publicationId || "";
        return session;
      } catch (error) {
        loggerServer.error("Error in session callback", {
          error,
          userId: token.sub as string,
        });
        throw error;
      }
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
    error: "/auth/error",
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
        const env = process.env.NODE_ENV;
        if (env === "production") {
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
          if (message.user.email) {
            await addSubscriber(message.user.email, {
              fullName: message.user.name || "",
            });
            await addTagToEmail(message.user.email, "writestack");
          }
        }
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
