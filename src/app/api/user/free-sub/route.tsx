import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { Plan } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const freeUser = await prisma.freeUsers.findFirst({
      where: { code },
    });

    let plan = "free";
    if (freeUser) {
      const now = new Date();
      const canUseCode =
        freeUser.codeExpiresAt &&
        freeUser.codeExpiresAt > now &&
        freeUser.status === "new";

      if (!canUseCode) {
        return NextResponse.json({ error: "Code is invalid" }, { status: 400 });
      }

      console.log("canUseCode is true", freeUser);
      plan = freeUser.plan;
      await prisma.freeUsers.update({
        where: {
          id: freeUser.id,
        },
        data: {
          email: session.user.email as string,
          status: "used",
        },
      });
      await prisma.userMetadata.update({
        where: {
          userId: session.user.id,
        },
        data: {
          plan: plan as Plan,
        },
      });
      console.log("updated user metadata");
    }
    return NextResponse.json({ message: "Hello, world!" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
