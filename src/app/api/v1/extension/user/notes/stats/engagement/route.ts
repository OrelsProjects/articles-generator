import { getAuthorId } from "@/lib/dal/publication";
import loggerServer from "@/loggerServer";
import { IntervalStats, NoteStats } from "@/types/notes-stats";
import { NextRequest, NextResponse } from "next/server";
import { prismaArticles } from "@/lib/prisma";
import { decodeKey } from "@/lib/dal/extension-key";
import { format, getISOWeek, getISOWeekYear } from "date-fns";

const getFormattedPeriod = (ts: Date, interval: string): string => {
  switch (interval) {
    case "day":
      return format(ts, "yyyy-MM-dd");
    case "week":
      const week = getISOWeek(ts);
      const year = getISOWeekYear(ts);
      return `${year}-W${String(week).padStart(2, "0")}`; // Example: 2025-W05
    case "month":
      return format(ts, "yyyy-MM");
    case "year":
      return format(ts, "yyyy");
    default:
      throw new Error("Invalid interval");
  }
};

export async function GET(request: NextRequest) {
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
  const userId = decoded.userId;
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
    loggerServer.warn("Unauthorized, bad secret in get notes for stats", {
      userId,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get("interval") || "day";
    const authorIdFromExtension = decoded.authorId;

    if (!authorIdFromExtension) {
      loggerServer.warn("No author id in get notes for stats", {
        userId,
      });
      return NextResponse.json({ error: "No author id" }, { status: 400 });
    }

    const authorId = await getAuthorId(userId);
    if (!authorId) {
      loggerServer.error("Author not found in notes stats", {
        userId,
      });
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    if (authorIdFromExtension !== authorId) {
      loggerServer.warn("Author id mismatch in notes stats", {
        userId,
        authorIdFromExtension,
        authorId,
      });
      return NextResponse.json(
        { error: "Unauthorized access to data" },
        { status: 401 },
      );
    }

    const formatMap: Record<string, string> = {
      day: "yyyy-MM-dd",
      week: "IYYY-IW",
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

      const period = getFormattedPeriod(ts, interval);

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

    const totalClicks = Object.values(clicksMap).reduce(
      (acc: number, curr: number) => acc + curr,
      0,
    );
    const totalFollows = Object.values(followsMap).reduce(
      (acc: number, curr: number) => acc + curr,
      0,
    );
    const totalShareClicks = Object.values(sharesMap).reduce(
      (acc: number, curr: number) => acc + curr,
      0,
    );
    const response: NoteStats = {
      reactions: toIntervalStats(clicksMap),
      restacks: toIntervalStats(sharesMap),
      comments: toIntervalStats(followsMap),
      totalClicks: toIntervalStats(clicksMap),
      totalFollows: toIntervalStats(followsMap),
      totalPaidSubscriptions: toIntervalStats(paidSubsMap),
      totalFreeSubscriptions: toIntervalStats(freeSubsMap),
      notes: [],
      engagementTotals: {
        follows: totalStats._sum.totalFollows || 0,
        freeSubscriptions: totalStats._sum.totalFreeSubscriptions || 0,
        paidSubscriptions: totalStats._sum.totalPaidSubscriptions || 0,
        clicks: totalClicks,
        reactions: totalClicks,
        restacks: totalShareClicks,
        comments: totalFollows,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    loggerServer.error("Error getting notes engagement stats", {
      error,
      userId,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
