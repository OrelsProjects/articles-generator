import { prisma, prismaArticles } from "@/lib/prisma";
import { getUrlComponents } from "@/lib/utils/url";
import { Byline } from "../../../prisma/generated/articles";

export async function getByline(authorId: number) {
  return await prismaArticles.byline.findUnique({
    where: { id: authorId },
  });
}

export async function getBylines (authorIds: number[]) {
  return await prismaArticles.byline.findMany({
    where: {
      id: { in: authorIds },
    },
  });
}

export async function getBylineByUserId(userId: string) {
  const userMetadata = await prisma.userMetadata.findUnique({
    where: { userId },
    include: {
      publication: true,
    },
  });
  if (!userMetadata?.publication?.authorId) {
    return null;
  }

  const byline = await prismaArticles.byline.findFirst({
    where: {
      id: userMetadata.publication?.authorId,
    },
  });

  return byline;
}

export async function searchByline(query: string, page: number, limit: number) {
  return await prismaArticles.byline.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { handle: { contains: query, mode: "insensitive" } },
        { bio: { contains: query, mode: "insensitive" } },
      ],
    },
    // orderBy: {
    //   notes: {
    //     _count: "desc",
    //   },
    // },
    take: limit,
    skip: (page - 1) * limit,
  });
}

export async function upsertByline(byline: Byline) {
  return await prismaArticles.byline.upsert({
    where: { id: byline.id },
    update: byline,
    create: byline,
  });
}

export async function getBylineData (authorId: number) {
  return await prismaArticles.bylineData.findUnique({
    where: { id: authorId },
  });
}

export async function getBylinesData(authorIds: number[]) {
  return await prismaArticles.bylineData.findMany({
    where: {
      id: { in: authorIds },
    },
  });
}