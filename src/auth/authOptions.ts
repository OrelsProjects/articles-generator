import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Plan, PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const getCode = (): string => {
  const code = cookies().get("code")?.value;
  return code || "";
};

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
        const code = getCode();
        console.log("createUser code: ", code);
        const freeUser = await prisma.freeUsers.findFirst({
          where: {
            OR: [{ email: message.user.email as string }, { code }],
          },
        });

        let plan = "free";
        if (freeUser) {
          const now = new Date();
          const canUseCode =
            (freeUser.codeExpiresAt && freeUser.codeExpiresAt > now) ||
            freeUser.status === "new";

          console.log("canUseCode: ", canUseCode);

          if (!canUseCode) {
            console.log("canUseCode is false", freeUser);
            plan = "free";
          } else {
            console.log("canUseCode is true", freeUser);
            plan = freeUser.plan;
            await prisma.freeUsers.update({
              where: {
                id: freeUser.id,
              },
              data: {
                email: message.user.email as string,
                status: "used",
              },
            });
            console.log("deleted code");
            cookies().delete("code");
          }
        }

        await prisma.userMetadata.create({
          data: {
            userId: message.user.id,
            plan: plan as Plan,
          },
        });
        console.log("created user metadata");
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
