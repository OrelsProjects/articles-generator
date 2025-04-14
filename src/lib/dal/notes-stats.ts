import { prismaArticles } from "@/app/api/_db/db";
import { HourlyStats } from "@/types/notes-status";

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
