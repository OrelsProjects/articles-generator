import { authOptions } from "@/auth/authOptions";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import loggerServer from "@/loggerServer";
import { getPopularTopics } from "@/lib/dal/topics";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const topics = await getPopularTopics({ limit: 10 });
    return NextResponse.json(topics);
  } catch (error) {
    loggerServer.error("Error getting popular topics:", {
      error: error,
      userId: session.user.id,
      url: request.url,
    });
    return NextResponse.json(
      { error: "Failed to get popular topics" },
      { status: 500 },
    );
  }
}
