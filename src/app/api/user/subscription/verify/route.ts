import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { getActiveSubscription } from "@/lib/dal/subscription";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const subscription = await getActiveSubscription(session.user.id);

    if (!subscription) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Error fetching subscription", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
