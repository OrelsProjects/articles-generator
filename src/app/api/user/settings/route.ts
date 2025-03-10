import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { AllUsages } from "@/types/settings";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "active",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const usages: AllUsages = {
      credits: {
        remaining: subscription.creditsRemaining,
        total: subscription.creditsPerPeriod,
        used: subscription.creditsPerPeriod - subscription.creditsRemaining,
      },
    };

    return NextResponse.json({ usages });
  } catch (error: any) {
    loggerServer.error("Error getting usages", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
