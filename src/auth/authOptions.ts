import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import loggerServer from "@/loggerServer";

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
      const userMetadata = await prisma.userMetadata.findUnique({
        where: {
          userId: token.sub as string,
        },
      });
      session.user.meta = { plan: userMetadata?.plan || "free" };
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
        const isFreeUser = await prisma.freeUsers.findUnique({
          where: {
            email: message.user.email as string,
          },
        });
        await prisma.userMetadata.create({
          data: {
            userId: message.user.id,
            plan: isFreeUser ? "superPro" : "free",
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
