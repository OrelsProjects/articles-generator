import { authOptions } from "@/auth/authOptions";
import { getBestTimesToPublish } from "@/lib/dal/notes-stats";
import { getAuthorId } from "@/lib/dal/publication";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  try {
    const authorId = await getAuthorId(userId);
    if (!authorId) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    const postTime = await getBestTimesToPublish(authorId);
    return NextResponse.json(postTime);
  } catch (error: any) {
    loggerServer.error("Error getting post time", {
      error,
      userId,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
