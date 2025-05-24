import { authOptions } from "@/auth/authOptions";
import { getNoteStats } from "@/lib/dal/notes-stats";
import { getAuthorId } from "@/lib/dal/publication";
import loggerServer from "@/loggerServer";
import { ReactionInterval } from "@/types/notes-stats";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get("interval") || "day";

    const authorId = await getAuthorId(session.user.id);

    if (!authorId) {
      loggerServer.error("Author not found in notes stats", {
        userId: session.user.id,
      });
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    const noteStats = await getNoteStats(
      interval as ReactionInterval,
      authorId,
    );
    return NextResponse.json(noteStats);
  } catch (error) {
    loggerServer.error("Error getting notes stats", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
