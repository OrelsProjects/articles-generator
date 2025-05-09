import { prismaArticles } from "@/lib/prisma";

export const getAuthorNotes = async (
  authorId: number,
  options: {
    take?: number;
    skip?: number;
    orderBy?: "reactionCount" | "commentCount" | "timestamp";
  },
) => {
  const orderBy = options?.orderBy
    ? {
        [options.orderBy]: "desc",
      }
    : undefined;
  const take = options?.take || 100;
  const skip = options?.skip || 0;

  const notes = await prismaArticles.notesComments.findMany({
    where: {
      authorId,
    },
    orderBy,
    take,
    skip,
  });

  return notes;
};
