import { NextRequest, NextResponse } from "next/server";
import { prisma, prismaArticles } from "@/lib/prisma";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { getAuthorId } from "@/lib/dal/publication";
import {
  NOTES_STATS_FETCHING_EARLIEST_DATE,
  NOTES_STATS_FETCHING_INTERVAL,
} from "@/lib/consts";
import { isWithinInterval } from "date-fns";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    loggerServer.warn("[GETTING-NOTES-FOR-STATS] Unauthorized, no session", {
      userId: "not logged in",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  loggerServer.info("[GETTING-NOTES-FOR-STATS] User requested notes for stats", {
    userId: session.user.id,
  });
  try {
    const secret = request.headers.get("x-api-key");
    if (secret !== process.env.EXTENSION_API_KEY) {
      loggerServer.warn("[GETTING-NOTES-FOR-STATS] Unauthorized, bad secret in get notes for stats", {
        userId: session.user.id,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // TODO: check if user is active
    const authorId = await getAuthorId(session.user.id);

    if (!authorId) {
      loggerServer.warn("[GETTING-NOTES-FOR-STATS] Unauthorized, no authorId", {
        userId: session.user.id,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    loggerServer.info("[GETTING-NOTES-FOR-STATS] Getting notes for stats", {
      authorId,
      userId: session.user.id,
    });

    const notes = await prismaArticles.notesComments.findMany({
      where: {
        authorId,
        noteIsRestacked: false,
      },
      orderBy: {
        date: "desc",
      },
    });

    const lastFetchedNotesAt = await prisma.dataFetchedMetadata.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    loggerServer.info("[GETTING-NOTES-FOR-STATS] Found notes", {
      notesCount: notes.length,
      userId: session.user.id,
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

    if (lastFetchedNotesAt && lastFetchedNotesAt.lastFetchedNotesAt) {
      const lastFetchedNotesAtDate = new Date(
        lastFetchedNotesAt.lastFetchedNotesAt,
      );

      const start = new Date(Date.now() - NOTES_STATS_FETCHING_INTERVAL);
      const end = new Date();

      const shouldFetchNotesStats = !isWithinInterval(lastFetchedNotesAtDate, {
        start,
        end,
      });
      if (!shouldFetchNotesStats) {
        loggerServer.info("[GETTING-NOTES-FOR-STATS] No need to fetch notes for stats", {
          userId: session.user.id,
        });
        return NextResponse.json([]);
      } else {
        // Return notes from the last 2 weeks
        const notesFromLast2Weeks = uniqueNotes.filter(note => {
          const noteDate = new Date(note.date);
          return isWithinInterval(noteDate, {
            start: NOTES_STATS_FETCHING_EARLIEST_DATE,
            end: new Date(),
          });
        });
        loggerServer.info("[GETTING-NOTES-FOR-STATS] Fetching notes for stats", {
          notesCount: notesFromLast2Weeks.length,
          userId: session.user.id,
        });
        return NextResponse.json(
          notesFromLast2Weeks.map(({ commentId }) => ({
            commentId,
          })),
        );
      }
    }

    loggerServer.info("[GETTING-NOTES-FOR-STATS] Fetching notes for stats", {
      notesCount: uniqueNotes.length,
      userId: session.user.id,
    });

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
