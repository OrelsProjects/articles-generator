import prisma, { prismaArticles } from "@/app/api/_db/db";
import { Publication } from "../../../prisma/generated/articles";
import { stripUrl } from "@/lib/utils/url";
import { extractContent } from "@/app/api/user/analyze/_utils";

export const getPublicationByUrl = async (
  url: string,
): Promise<Publication[]> => {
  const strippedUrl = stripUrl(url, { removeWww: true, removeDotCom: true });

  let publications = await prismaArticles.publication.findMany({
    where: {
      OR: [
        {
          customDomain: {
            contains: strippedUrl,
          },
        },
        {
          subdomain: {
            contains: strippedUrl,
          },
        },
      ],
    },
  });

  if (publications.length === 0) {
    const { image, title, description } = await extractContent(url);
    publications = await prismaArticles.publication.findMany({
      where: {
        OR: [
          {
            logoUrl: {
              contains: image,
            },
          },
          {
            name: title,
          },
        ],
      },
    });
  }

  return publications as Publication[];
};

export const getAuthorId = async (
  userId: string,
  options: { updateIfNotFound: boolean } = { updateIfNotFound: true },
): Promise<number | null> => {
  const userPublication = await prisma.userMetadata.findFirst({
    where: {
      userId,
    },
    include: {
      publication: {
        select: {
          id: true,
          idInArticlesDb: true,
          authorId: true,
        },
      },
    },
  });
  if (userPublication?.publication?.authorId) {
    return userPublication.publication.authorId;
  }

  if (!userPublication?.publication?.idInArticlesDb) {
    return null;
  }

  const publication = await prismaArticles.publication.findFirst({
    where: {
      id: userPublication.publication.idInArticlesDb,
    },
  });

  if (!publication || !publication.authorId) {
    return null;
  }

  const authorId = Number(publication.authorId);

  if (isNaN(authorId)) {
    return null;
  }

  if (options.updateIfNotFound) {
    await prisma.publicationMetadata.update({
      where: { id: userPublication.publication.id },
      data: { authorId },
    });
  }

  return Number(publication.authorId);
};

export const getHandleDetails = async (
  authorId: number,
): Promise<{ handle: string; name: string; photoUrl: string }> => {
  const notesFromAuthor = await prismaArticles.notesComments.findMany({
    where: {
      authorId: parseInt(authorId.toString()),
      handle: {
        not: "",
      },
      name: {
        not: "",
      },
      photoUrl: {
        not: "",
      },
    },
    orderBy: {
      reactionCount: "desc",
    },
    select: {
      handle: true,
      name: true,
      photoUrl: true,
    },
    take: 1,
  });

  return { ...notesFromAuthor[0] };
};

export const getPublicationArticles = async (publicationId: string) => {
  const articles = await prismaArticles.post.findMany({
    where: {
      publicationId,
    },
  });

  return articles;
};
