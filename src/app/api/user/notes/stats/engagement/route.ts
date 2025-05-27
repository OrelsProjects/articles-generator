import { authOptions } from "@/auth/authOptions";
import { getAuthorId } from "@/lib/dal/publication";
import loggerServer from "@/loggerServer";
import { IntervalStats, ReactionInterval } from "@/types/notes-stats";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prismaArticles } from "@/lib/prisma";
import { format } from "date-fns";

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

    const formatMap: Record<string, string> = {
      day: "yyyy-MM-dd",
      month: "yyyy-MM",
      year: "yyyy",
    };

    const dateFormat = formatMap[interval];
    if (!dateFormat) throw new Error("Invalid interval");

    const stats = await prismaArticles.notesCommentsStats.findMany({
      where: { authorId },
      include: { comment: { select: { timestamp: true } } },
    });

    // Initialize per-metric maps
    const clicksMap: Record<string, number> = {};
    const followsMap: Record<string, number> = {};
    const paidSubsMap: Record<string, number> = {};
    const freeSubsMap: Record<string, number> = {};
    const arrMap: Record<string, number> = {};
    const sharesMap: Record<string, number> = {};

    for (const row of stats) {
      const ts = row.comment?.timestamp;
      if (!ts) continue;

      const period = format(ts, dateFormat);

      clicksMap[period] = (clicksMap[period] || 0) + row.totalClicks;
      followsMap[period] = (followsMap[period] || 0) + row.totalFollows;
      paidSubsMap[period] =
        (paidSubsMap[period] || 0) + row.totalPaidSubscriptions;
      freeSubsMap[period] =
        (freeSubsMap[period] || 0) + row.totalFreeSubscriptions;
      arrMap[period] = (arrMap[period] || 0) + row.totalArr;
      sharesMap[period] = (sharesMap[period] || 0) + row.totalShareClicks;
    }

    // Convert each map to IntervalStats[]
    const toIntervalStats = (map: Record<string, number>): IntervalStats[] =>
      Object.entries(map)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, total]) => ({ period, total }));

    const totalStats = await prismaArticles.notesCommentsStats.aggregate({
      where: { authorId },
      _sum: {
        totalFollows: true,
        totalFreeSubscriptions: true,
        totalPaidSubscriptions: true,
      },
    });

    return NextResponse.json({
      stats: {
        clicks: toIntervalStats(clicksMap),
        follows: toIntervalStats(followsMap),
        paidSubscriptions: toIntervalStats(paidSubsMap),
        freeSubscriptions: toIntervalStats(freeSubsMap),
        arr: toIntervalStats(arrMap),
        shares: toIntervalStats(sharesMap),
      },
      totals: {
        follows: totalStats._sum.totalFollows || 0,
        freeSubscriptions: totalStats._sum.totalFreeSubscriptions || 0,
        paidSubscriptions: totalStats._sum.totalPaidSubscriptions || 0,
      },
    });
  } catch (error) {
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
