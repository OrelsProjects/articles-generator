import { authOptions } from "@/auth/authOptions";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import loggerServer from "@/loggerServer";
import { z } from "zod";
import { prisma, prismaArticles } from "@/lib/prisma";
import { decodeKey } from "@/lib/dal/extension-key";

export const maxDuration = 180;

const schema = z.object({
  stats: z.array(
    z.object({
      comment_id: z.string(),
      author_id: z.number(),
      total_clicks: z.number(),
      total_follows: z.number(),
      total_paid_subscriptions: z.number(),
      total_free_subscriptions: z.number(),
      total_arr: z.number(),
      total_share_clicks: z.number(),
    }),
  ),
  isLastBatch: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  loggerServer.info("[SAVING-NOTES-STATS] Saving notes stats", {
    userId: "not logged in",
  });
  const key = request.headers.get("x-extension-key");
  if (!key) {
    loggerServer.warn("[SAVING-NOTES-STATS] Unauthorized, no extension key", {
      userId: "not logged in",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const decoded = decodeKey(key);
  const userId = decoded.userId;
  if (!userId) {
    loggerServer.warn("[SAVING-NOTES-STATS] Unauthorized, no userId in key", {
      userId: "not logged in",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = request.headers.get("x-api-key");
  if (secret !== process.env.EXTENSION_API_KEY) {
    loggerServer.warn(
      "[SAVING-NOTES-STATS] Unauthorized, bad secret in save notes stats",
      {
        userId,
      },
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsedBody = schema.safeParse(body);
    if (!parsedBody.success) {
      loggerServer.warn("[SAVING-NOTES-STATS] Invalid body", {
        userId,
        body,
      });
      return NextResponse.json(
        { error: parsedBody.error.message },
        { status: 400 },
      );
    }

    const { stats, isLastBatch } = parsedBody.data;
    loggerServer.info("[SAVING-NOTES-STATS] Stats", {
      userId,
      statsLength: stats.length,
      stats: stats.slice(0, 10),
    });
    const notesForStats = await prismaArticles.notesComments.findMany({
      where: {
        commentId: {
          in: stats.map(stat => stat.comment_id),
        },
      },
    });

    const statsWithNotePostedAt = stats.map(stat => {
      const note = notesForStats.find(
        note => note.commentId === stat.comment_id,
      );
      return {
        ...stat,
        notePostedAt: note?.timestamp,
      };
    });

    // Process stats in batches of 10
    const batchSize = 10;
    for (let i = 0; i < statsWithNotePostedAt.length; i += batchSize) {
      const batch = statsWithNotePostedAt.slice(i, i + batchSize);

      try {
        await Promise.all(
          batch.map(stat =>
            prismaArticles.notesCommentsStats.upsert({
              where: {
                commentId_authorId: {
                  commentId: stat.comment_id,
                  authorId: stat.author_id,
                },
              },
              update: {
                totalClicks: stat.total_clicks,
                totalFollows: stat.total_follows,
                totalPaidSubscriptions: stat.total_paid_subscriptions,
                totalFreeSubscriptions: stat.total_free_subscriptions,
                totalArr: stat.total_arr,
                totalShareClicks: stat.total_share_clicks,
                notePostedAt: stat.notePostedAt,
              },
              create: {
                commentId: stat.comment_id,
                authorId: stat.author_id,
                totalClicks: stat.total_clicks,
                totalFollows: stat.total_follows,
                totalPaidSubscriptions: stat.total_paid_subscriptions,
                totalFreeSubscriptions: stat.total_free_subscriptions,
                totalArr: stat.total_arr,
                totalShareClicks: stat.total_share_clicks,
                notePostedAt: stat.notePostedAt,
              },
            }),
          ),
        );
      } catch (error: any) {
        loggerServer.error("[SAVING-NOTES-STATS] Error saving notes stats", {
          error: error.message,
          userId,
          batch,
        });
        await prisma.notesStatsFailed.create({
          data: {
            userId,
            notesJsonString: JSON.stringify(batch),
          },
        });
        loggerServer.error(
          "[SAVING-NOTES-STATS] Error saving notes stats in batch",
          {
            error: error.message,
            userId,
          },
        );
      }
    }
    if (isLastBatch) {
      await prisma.dataFetchedMetadata.upsert({
        where: {
          userId,
        },
        update: {
          lastFetchedNotesAt: new Date(),
        },
        create: {
          userId,
          lastFetchedNotesAt: new Date(),
        },
      });
    }
    return NextResponse.json({ message: "Stats saved" });
  } catch (error: any) {
    loggerServer.error(
      "[SAVING-NOTES-STATS] General error saving notes stats",
      {
        error: error.message,
        userId,
      },
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
