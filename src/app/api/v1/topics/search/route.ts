import { NextRequest, NextResponse } from "next/server";
import { searchTopics } from "@/lib/dal/topics";
import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";
import loggerServer from "@/loggerServer";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 },
      );
    }

    const topics = await searchTopics({ query, limit });

    return NextResponse.json({ topics });
  } catch (error) {
    loggerServer.error("Error searching topics:", {
      error: error,
      userId: session.user.id,
      query: query,
      limit: limit,
      url: request.url,
    });
    return NextResponse.json(
      { error: "Failed to search topics" },
      { status: 500 },
    );
  }
}
