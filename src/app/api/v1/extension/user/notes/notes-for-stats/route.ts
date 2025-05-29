import { NextRequest, NextResponse } from "next/server";
import { prismaArticles } from "@/lib/prisma";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { getAuthorId } from "@/lib/dal/publication";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const secret = request.headers.get("x-api-key");
    if (secret !== process.env.EXTENSION_API_KEY) {
      loggerServer.warn("Unauthorized, bad secret in get notes for stats", {
        userId: session.user.id,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // TODO: check if user is active
    const authorId = await getAuthorId(session.user.id);

    if (!authorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    loggerServer.info("Getting notes for stats", {
      authorId,
      userId: session.user.id,
    });

    const notes = await prismaArticles.notesComments.findMany({
      where: {
        authorId,
        noteIsRestacked: false,
      },
    });

    // Unique by commentId
    const uniqueNotes = notes.reduce(
      (acc, note) => {
        if (!acc.some(n => n.commentId === note.commentId)) {
          acc.push(note);
        }
        return acc;
      },
      [] as typeof notes,
    );

    return NextResponse.json(
      uniqueNotes.map(({ commentId }) => ({
        commentId,
      })),
    );
  } catch (error: any) {
    loggerServer.error("Error getting notes for stats", {
      error: error.message,
      userId: session?.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
