import { prismaArticles } from "@/app/api/_db/db";

export async function getByline(authorId: number) {
  return await prismaArticles.byline.findUnique({
    where: { id: authorId },
  });
}

export async function searchByline(query: string) {
  return await prismaArticles.byline.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { handle: { contains: query, mode: "insensitive" } },
      ],
    },
    // orderBy: {
    //   notes: {
    //     _count: "desc",
    //   },
    // },
    take: 10,
  });
}
