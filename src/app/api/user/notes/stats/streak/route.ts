import { authOptions } from "@/auth/authOptions";
import { getStreak } from "@/lib/dal/notes-stats";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const streak = await getStreak(session.user.id);
    return NextResponse.json(streak);
  } catch (error: any) {
    loggerServer.error("Error getting streak", {
      error,
      userId: session?.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
