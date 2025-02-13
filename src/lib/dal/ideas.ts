import prisma from "@/app/api/_db/db";

export const isIdeaBelongToUser = async (ideaId: string, userId: string) => {
  const idea = await prisma.idea.findFirst({
    where: {
      id: ideaId,
      userId: userId,
    },
  });

  return !!idea;
};
