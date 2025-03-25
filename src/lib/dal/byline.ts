import { prismaArticles } from "@/app/api/_db/db";

export async function getByline(authorId: number) {
  return await prismaArticles.byline.findUnique({
    where: { id: authorId },
  });
}
