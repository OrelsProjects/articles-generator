import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Plan, PrismaClient } from "@prisma/client";

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
      session.user.id = token.sub as string;
      const promises = [
        prisma.userMetadata.findUnique({
          where: {
            userId: token.sub as string,
          },
          select: {
            publicationId: true,
          },
        }),
        prisma.subscription.findFirst({
          where: {
            userId: token.sub as string,
            status: "active",
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            plan: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
          },
        }),
      ];
      const [userMetadata, subscription] = (await Promise.all(promises)) as [
        { publicationId: string | null } | null,
        { plan: string; currentPeriodStart: Date; currentPeriodEnd: Date; cancelAtPeriodEnd: boolean } | null,
      ];
      session.user.meta = {
        plan: subscription?.plan as Plan || "free",
        currentPeriodStart: subscription?.currentPeriodStart || null,
        currentPeriodEnd: subscription?.currentPeriodEnd || null,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
      };
      session.user.publicationId = userMetadata?.publicationId || "";
      return session;
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
