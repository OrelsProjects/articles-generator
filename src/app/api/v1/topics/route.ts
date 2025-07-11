import { NextRequest, NextResponse } from "next/server";
import { addTopics } from "@/lib/dal/topics";
import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";
import loggerServer from "@/loggerServer";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { topics } = body;

  try {
    if (!topics) {
      loggerServer.error("Topics are required to create a topic", {
        userId: session.user.id,
        url: request.url,
      });
      return NextResponse.json(
        { error: "Topics are required" },
        { status: 400 },
      );
    }

    await addTopics(topics);

    return NextResponse.json({ success: true });
  } catch (error) {
    loggerServer.error("Error adding topics:", {
      error: error,
      userId: session.user.id,
      topics: topics,
      url: request.url,
    });
    return NextResponse.json(
      { error: "Failed to add topics" },
      { status: 500 },
    );
  }
}
