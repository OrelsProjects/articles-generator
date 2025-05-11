import { Engager } from "@/types/engager";

export const addScoreToPotentialUsers = <T extends { id: number | string }>(
  users: T[],
) => {
  // count the amount of time each user appears in the list and order them by that.
  // Return list with unique users, mapping their id to the amount of times they appear in the list.
  const appearanceCount = users.reduce(
    (acc, user) => {
      acc[`${user.id}`] = (acc[`${user.id}`] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  return appearanceCount;
};

export const addScoreToEngagers = (engagers: Engager[]) => {
  const formattedEngagers = engagers.map(engager => ({
    id: engager.authorId,
    name: engager.name,
    photoUrl: engager.photoUrl,
    subscriberCount: engager.subscriberCount,
  }));
  const scoredEngagers = addScoreToPotentialUsers(formattedEngagers);
  const engagersWithScore = engagers.map(engager => {
    const score = scoredEngagers[engager.authorId];
    return {
      ...engager,
      score,
    };
  });
  return engagersWithScore;
};
