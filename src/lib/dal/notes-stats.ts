import { prismaArticles } from "@/app/api/_db/db";
import { getAuthorId } from "@/lib/dal/publication";
import { HourlyStats, Streak } from "@/types/notes-stats";

export interface HourlyStatsDb {
  user_id: number;
  hour_of_day: number;
  weighted_score: number;
}

export async function getBestTimesToPublish(
  authorId: number,
): Promise<HourlyStats[]> {
  const result = await prismaArticles.$queryRaw<HourlyStatsDb[]>`
  SELECT
    user_id,
    EXTRACT(HOUR FROM "date") AS hour_of_day,
    COUNT(*) AS note_count,
    AVG(reaction_count) AS avg_reaction,
    COUNT(*) * AVG(reaction_count) AS weighted_score
  FROM notes_comments
  WHERE user_id = ${authorId}
  GROUP BY user_id, hour_of_day
  ORDER BY weighted_score DESC;
`;

  return result.map(item => ({
    userId: item.user_id,
    hourOfDayUTC: item.hour_of_day.toString(),
    adjustedAvgReaction: Number(item.weighted_score), // This is now your new "score"
  }));
}

export async function getStreak(userId: string): Promise<Streak[]> {
  const authorId = await getAuthorId(userId);
  if (!authorId) {
    throw new Error("Author not found");
  }
  const notes = await prismaArticles.notesComments.findMany({
    where: {
      authorId: authorId,
    },
  });
  // set streak by dates. So if 4 notes were published on X date, it'll be: {date: X, notes: 4}
  const streak: Streak[] = notes.reduce(
    (acc: Streak[], note) => {
      const date = new Date(note.date);
      const streakDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );
      const existingDateIndex = acc.findIndex(
        item => item.date.getTime() === streakDate.getTime(),
      );
      if (existingDateIndex === -1) {
        acc.push({ date: streakDate, notes: 1 });
      } else {
        acc[existingDateIndex].notes++;
      }
      return acc;
    },
    [],
  );
  return streak;
}
