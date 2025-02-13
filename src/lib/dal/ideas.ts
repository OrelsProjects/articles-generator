import prisma from "@/app/api/_db/db";

export const isIdeaBelongToUser = async (data: {
  ideaId: string;
  userId: string;
}) => {
  const idea = await prisma.idea.findFirst({
    where: {
      id: data.ideaId,
      userId: data.userId,
    },
  });

  return !!idea;
};
