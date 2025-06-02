import { prismaArticles } from "@/lib/prisma";
import { getAuthorId } from "@/lib/dal/publication";
import {
  HourlyStats,
  IntervalStats,
  NoteStats,
  ReactionInterval,
  Streak,
} from "@/types/notes-stats";
import { NotesComments } from "../../../prisma/generated/articles";
import { Prisma } from "@prisma/client";
import moment from "moment-timezone";

export async function getBestTimesToPublish(
  authorId: number,
): Promise<HourlyStats[]> {
  // 1) Grab global mean and variance
  const [global] = await prismaArticles.$queryRaw<
    { mu: number; variance: number }[]
  >`
    SELECT
      AVG(reaction_count)::float AS mu,
      VAR_POP(reaction_count)::float AS variance
    FROM notes_comments
    WHERE user_id = ${authorId}
  `;

  // 2) If no variance, run the simple AVG*COUNT algorithm
  if (!global.variance || global.variance === 0) {
    const raw = await prismaArticles.$queryRaw<
      {
        hour_of_day: number;
        note_count: number;
        avg_reaction: string; // comes back as text
        weighted_score: string; // comes back as text
      }[]
    >`
      SELECT
        EXTRACT(HOUR FROM "date") AS hour_of_day,
        COUNT(*)                   AS note_count,
        AVG(reaction_count)        AS avg_reaction,
        COUNT(*) * AVG(reaction_count) AS weighted_score
      FROM notes_comments
      WHERE user_id = ${authorId}
      GROUP BY hour_of_day
      ORDER BY weighted_score DESC
    `;

    return raw.map(r => ({
      userId: authorId,
      hourOfDayUTC: r.hour_of_day.toString(),
      adjustedAvgReaction: Number(r.weighted_score),
    }));
  }

  // 3) Otherwise do the Bayesian smoothing
  const bayes = await prismaArticles.$queryRaw<
    {
      hour_of_day: number;
      note_count: number;
      bayes_weighted_score: number;
    }[]
  >(Prisma.sql`WITH
      stats AS (
        SELECT
          AVG(reaction_count)::float AS mu,
          VAR_POP(reaction_count)::float AS var
        FROM notes_comments
        WHERE user_id = ${authorId}
      ),
      hyper AS (
        SELECT
          mu,
          var,
          (mu * mu) / (var - mu) AS a,
          mu / (var - mu)       AS b
        FROM stats
      ),
      hours AS (
        SELECT
          EXTRACT(HOUR FROM "date") AS hour_of_day,
          COUNT(*)                  AS note_count,
          SUM(reaction_count)       AS s
        FROM notes_comments
        WHERE user_id = ${authorId}
        GROUP BY hour_of_day
      )
    SELECT
      h.hour_of_day,
      h.note_count,
      h.note_count * ((hyper.a + h.s) / (hyper.b + h.note_count))
        AS bayes_weighted_score
    FROM hours h
    CROSS JOIN hyper
    ORDER BY bayes_weighted_score DESC`);

  return bayes.map(b => ({
    userId: authorId,
    hourOfDayUTC: b.hour_of_day.toString(),
    adjustedAvgReaction: b.bayes_weighted_score,
  }));
}

export async function getStreak(
  userId: string,
  timezone: string,
): Promise<Streak[]> {
  const authorId = await getAuthorId(userId);
  if (!authorId) {
    throw new Error("Author not found");
  }
  const notes = await prismaArticles.notesComments.findMany({
    where: {
      authorId: authorId,
    },
  });

  // Set streak by dates with the new format
  const streak = calculateStreak(notes, timezone);
  return streak;
}

export function calculateStreak(notes: NotesComments[], timezone?: string) {
  const streak: Streak[] = notes.reduce((acc: Streak[], note) => {
    const date = moment(note.date).tz(timezone || "UTC");
    const month = (date.get("month") + 1).toString().padStart(2, "0"); // Month is 0-indexed
    const day = date.get("date").toString().padStart(2, "0");
    const year = date.get("year").toString();

    const existingDateIndex = acc.findIndex(
      item => item.year === year && item.month === month && item.day === day,
    );

    if (existingDateIndex === -1) {
      acc.push({ month, day, year, notes: 1 });
    } else {
      acc[existingDateIndex].notes++;
    }

    return acc;
  }, []);

  return streak;
}

export async function getNoteStats(
  interval: ReactionInterval,
  authorId: number,
  options?: {
    maxDaysBack?: number;
  },
): Promise<NoteStats> {
  let groupFormat: string;

  switch (interval) {
    case "day":
      groupFormat = "YYYY-MM-DD";
      break;
    case "week":
      groupFormat = "IYYY-IW";
      break;
    case "month":
      groupFormat = "YYYY-MM";
      break;
    case "year":
      groupFormat = "YYYY";
      break;
    default:
      throw new Error("Invalid interval");
  }

  const dateFilter = options?.maxDaysBack
    ? `AND timestamp >= NOW() - INTERVAL '${options.maxDaysBack} days'`
    : "";

  const [reactions, restacks, comments] = await Promise.all([
    prismaArticles.$queryRawUnsafe<IntervalStats[]>(
      `
      SELECT TO_CHAR(timestamp, $1) AS period,
             SUM(reaction_count)::int AS total
      FROM notes_comments
      WHERE user_id = ${authorId}
        AND note_is_restacked = false
        ${dateFilter}
      GROUP BY period
      ORDER BY period;
      `,
      groupFormat,
    ),

    prismaArticles.$queryRawUnsafe<IntervalStats[]>(
      `
      SELECT TO_CHAR(timestamp, $1) AS period,
             COUNT(*)::int AS total
      FROM notes_comments
      WHERE user_id = ${authorId}
        AND note_is_restacked = true
        ${dateFilter}
      GROUP BY period
      ORDER BY period;
      `,
      groupFormat,
    ),

    prismaArticles.$queryRawUnsafe<IntervalStats[]>(
      `
      SELECT TO_CHAR(timestamp, $1) AS period,
             SUM(children_count)::int AS total
      FROM notes_comments
      WHERE user_id = ${authorId}
        AND note_is_restacked = false
        ${dateFilter}
      GROUP BY period
      ORDER BY period;
      `,
      groupFormat,
    ),
  ]);

  return {
    reactions: reactions || [],
    restacks: restacks || [],
    comments: comments || [],
    totalClicks: [],
    totalFollows: [],
    totalPaidSubscriptions: [],
    totalFreeSubscriptions: [],
    notes: [],
    totalArr: [],
    totalShareClicks: [],
    engagementTotals: {
      clicks: 0,
      follows: 0,
      paidSubscriptions: 0,
      freeSubscriptions: 0,
      reactions: 0,
      restacks: 0,
      comments: 0,
    },
  };
}
