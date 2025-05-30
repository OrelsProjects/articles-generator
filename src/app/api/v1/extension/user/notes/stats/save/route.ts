import { authOptions } from "@/auth/authOptions";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import loggerServer from "@/loggerServer";
import { z } from "zod";
import { prisma, prismaArticles } from "@/lib/prisma";

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
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    loggerServer.warn("Unauthorized, no session", {
      userId: "unknown",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const secret = request.headers.get("x-api-key");
  if (secret !== process.env.EXTENSION_API_KEY) {
    loggerServer.warn("Unauthorized, bad secret in save notes stats", {
      userId: session.user.id,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsedBody = schema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.message },
        { status: 400 },
      );
    }

    const { stats } = parsedBody.data;

    // Process stats in batches of 10
    const batchSize = 10;
    for (let i = 0; i < stats.length; i += batchSize) {
      const batch = stats.slice(i, i + batchSize);

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
            },
          }),
        ),
      );
    }

    await prisma.dataFetchedMetadata.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        lastFetchedNotesAt: new Date(),
      },
      create: {
        userId: session.user.id,
        lastFetchedNotesAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Stats saved" });
  } catch (error: any) {
    loggerServer.error("Error saving notes stats", {
      error: error.message,
      userId: session?.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
