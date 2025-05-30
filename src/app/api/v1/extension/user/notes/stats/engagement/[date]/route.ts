import { authOptions } from "@/auth/authOptions";
import { getAuthorId } from "@/lib/dal/publication";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";
import { prismaArticles } from "@/lib/prisma";
import { NoteWithEngagementStats } from "@/types/notes-stats";

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const { date } = params;
    const secret = request.headers.get("x-api-key");
    if (secret !== process.env.EXTENSION_API_KEY) {
      loggerServer.warn("Unauthorized, bad secret in get notes for stats", {
        userId: session.user.id,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authorIdFromExtension = searchParams.get("author_id");

    if (!authorIdFromExtension) {
      loggerServer.warn("No author id in get notes for stats", {
        userId: session.user.id,
      });
      return NextResponse.json({ error: "No author id" }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const authorId = await getAuthorId(session.user.id);
    if (!authorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authorIdFromExtension !== authorId.toString()) {
      loggerServer.warn("Author id mismatch in get notes for stats in date", {
        userId: session.user.id,
        authorIdFromExtension,
        authorId,
        date,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startOfDayDate = startOfDay(dateObj);
    const endOfDayDate = endOfDay(dateObj);

    const notes = await prismaArticles.notesComments.findMany({
      where: {
        authorId,
        noteIsRestacked: false,
        timestamp: {
          gte: startOfDayDate,
          lte: endOfDayDate,
        },
      },
      include: {
        stats: true,
      },
    });

    const response: NoteWithEngagementStats[] = notes.map(note => ({
      commentId: note.commentId,
      body: note.body,
      date: new Date(note.date),
      handle: note.handle || session.user.name?.replace(" ", "") || "",
      name: note.name || session.user.name || "",
      photoUrl: note.photoUrl || session.user.image || "",
      reactionCount: note.reactionCount || 0,
      commentsCount: note.commentsCount || 0,
      restacks: note.restacks || 0,
      totalClicks: note.stats?.totalClicks || 0,
      totalFollows: note.stats?.totalFollows || 0,
      totalPaidSubscriptions: note.stats?.totalPaidSubscriptions || 0,
      totalFreeSubscriptions: note.stats?.totalFreeSubscriptions || 0,
      totalArr: note.stats?.totalArr || 0,
      totalShareClicks: note.stats?.totalShareClicks || 0,
    }));

    return NextResponse.json(response);
  } catch (error: any) {
    loggerServer.error("Error getting notes engagement stats", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
