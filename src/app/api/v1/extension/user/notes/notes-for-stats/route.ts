import { NextRequest, NextResponse } from "next/server";
import { prisma, prismaArticles } from "@/lib/prisma";
import loggerServer from "@/loggerServer";
import {
  NOTES_STATS_FETCHING_EARLIEST_DATE,
  NOTES_STATS_FETCHING_INTERVAL,
} from "@/lib/consts";
import { isWithinInterval } from "date-fns";
import { decodeKey } from "@/lib/dal/extension-key";

export async function GET(request: NextRequest) {
  let userId: string | null = null;
  let authorId: number | null = null;
  try {
    const key = request.headers.get("x-extension-key");
    if (!key) {
      loggerServer.warn(
        "[GETTING-NOTES-FOR-STATS] Unauthorized, no extension key",
        {
          userId: "not logged in",
        },
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = decodeKey(key);
    userId = decoded.userId;
    authorId = decoded.authorId;
    if (!userId) {
      loggerServer.warn(
        "[GETTING-NOTES-FOR-STATS] Unauthorized, no userId in key",
        {
          userId: "not logged in",
        },
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const secret = request.headers.get("x-api-key");
    if (secret !== process.env.EXTENSION_API_KEY) {
      loggerServer.warn(
        "[GETTING-NOTES-FOR-STATS] Unauthorized, bad secret in get notes for stats",
        {
          userId,
        },
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!authorId) {
      loggerServer.warn("[GETTING-NOTES-FOR-STATS] Unauthorized, no authorId", {
        userId,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    loggerServer.info("[GETTING-NOTES-FOR-STATS] Getting notes for stats", {
      authorId,
      userId,
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
        userId,
      },
    });

    loggerServer.info("[GETTING-NOTES-FOR-STATS] Found notes", {
      notesCount: notes.length,
      userId,
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
        loggerServer.info(
          "[GETTING-NOTES-FOR-STATS] No need to fetch notes for stats",
          {
            userId,
          },
        );
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
        loggerServer.info(
          "[GETTING-NOTES-FOR-STATS] Fetching notes for stats",
          {
            notesCount: notesFromLast2Weeks.length,
            userId,
          },
        );
        return NextResponse.json(
          notesFromLast2Weeks.map(({ commentId }) => ({
            commentId,
          })),
        );
      }
    }

    loggerServer.info("[GETTING-NOTES-FOR-STATS] Fetching notes for stats", {
      notesCount: uniqueNotes.length,
      userId,
    });

    return NextResponse.json(
      uniqueNotes.map(({ commentId }) => ({
        commentId,
      })),
    );
  } catch (error: any) {
    loggerServer.error("Error getting notes for stats", {
      error: error.message,
      userId: userId || "not logged in",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
