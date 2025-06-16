import { prisma, prismaArticles } from "@/lib/prisma";
import { Publication } from "../../../prisma/generated/articles";
import { getUrlComponents, stripUrl } from "@/lib/utils/url";
import { extractContent } from "@/app/api/user/analyze/_utils";
import { getArticleEndpoint } from "@/lib/utils/publication";
import { PublicationDataResponse, PublicationDB } from "@/types/publication";

export const getPublicationByUrl = async (
  url: string,
  options: {
    createIfNotFound: boolean;
  } = {
    createIfNotFound: false,
  },
): Promise<Publication[]> => {
  const { validUrl } = getUrlComponents(url);
  const endpointToValidate = getArticleEndpoint(validUrl, 0, 1);

  const response = await fetch(endpointToValidate);
  if (!response.ok) {
    throw new Error("URL is not valid");
  }

  const data = await response.json();
  const id = data[0].id;

  const strippedUrl = stripUrl(url, { removeWww: true, removeDotCom: true });

  let publicationById = await prismaArticles.publication.findFirst({
    where: {
      id: id,
    },
  });

  let publicationByUrl = await prismaArticles.publication.findFirst({
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

  const publication = publicationById || publicationByUrl;
  let publications = publication ? [publication] : [];

  if (publications.length === 0 || publications[0].name === "Unknown") {
    const { image, title, description } = await extractContent(url);
    let OR: any[] = [];
    if (image) {
      OR.push({
        logoUrl: {
          contains: image,
        },
      });
    }

    if (title) {
      OR.push({
        name: title,
      });
    }

    if (OR.length > 0) {
      publications = await prismaArticles.publication.findMany({
        where: {
          OR,
        },
      });
    }

    if (publications.length === 0 || publications[0].name === "Unknown") {
      if (options.createIfNotFound) {
        const publicationId = await createPublication(url);
        if (publicationId) {
          publications = await prismaArticles.publication.findMany({
            where: { id: publicationId },
          });
        }
      } else {
        return [];
      }
    }
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
  const notesFromAuthor = await prismaArticles.byline.findFirstOrThrow({
    where: {
      id: parseInt(authorId.toString()),
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
    select: {
      handle: true,
      name: true,
      photoUrl: true,
    },
  });

  return {
    handle: notesFromAuthor.handle || "",
    name: notesFromAuthor.name || "",
    photoUrl: notesFromAuthor.photoUrl || "",
  };
};

export async function createPublication(url: string): Promise<number | null> {
  const { validUrl } = getUrlComponents(url);
  const endpoint = `${validUrl}/api/v1/homepage_data`;
  const response = await fetch(endpoint);
  const data = (await response.json()) as PublicationDataResponse;
  if (data.newPosts.length === 0) {
    throw new Error("No new posts found for publication: " + validUrl);
  }
  const { image, title, description } = await extractContent(url);

  let publication: PublicationDB | null = null;
  for (const post of data.newPosts) {
    if (publication) {
      break;
    }
    post.publishedBylines.forEach(byline => {
      if (publication) {
        return;
      }
      byline.publicationUsers?.forEach(user => {
        if (publication) {
          return;
        }
        const pub = user.publication;
        if (pub.id === data.newPosts[0]?.publication_id) {
          publication = pub;
          return;
        }
      });
    });
  }

  if (!publication) {
    throw new Error("Publication not found for: " + validUrl);
  }

  const pub = publication as PublicationDB;

  const userPublication: Publication = {
    id: BigInt(pub.id),
    name: pub.name,
    subdomain: pub.subdomain,
    customDomain: pub.custom_domain,
    logoUrl: pub.logo_url || image,
    authorId: BigInt(pub.author_id),
    createdAt: new Date(pub.created_at),
    language: "en",
    customDomainOptional: false,
    heroText: pub.hero_text || description,
    emailFromName: pub.email_from_name || null,
    copyright: pub.copyright || title || "",
    explicit: pub.explicit || false,
    themeVarBackgroundPop: null,
    rssWebsiteUrl: null,
    foundingPlanName: null,
    communityEnabled: null,
    inviteOnly: null,
    paymentsState: null,
    isPersonalMode: null,
  };

  const existingPublication = await prismaArticles.publication.findUnique({
    where: { id: userPublication.id },
  });
  if (existingPublication && existingPublication.name !== "Unknown") {
    return Number(existingPublication.id);
  }
  await prismaArticles.publication.upsert({
    where: { id: userPublication.id },
    update: userPublication,
    create: userPublication,
  });

  return Number(userPublication.id);
}

export async function updatePublication(
  publicationId: string,
  data: Partial<Publication>,
) {
  await prismaArticles.publication.update({
    where: { id: Number(publicationId) },
    data,
  });
}

export async function updatePublicationCustomDomain(
  publicationId: string,
  oldCustomDomain: string,
  customDomain: string,
) {
  let isOldUrlValid = false;
  let isNewUrlValid = false;
  try {
    const response = await fetch(oldCustomDomain);
    isOldUrlValid = response.ok;
  } catch (error) {
    isOldUrlValid = false;
  }
  try {
    const response = await fetch(customDomain);
    isNewUrlValid = response.ok;
  } catch (error) {
    isNewUrlValid = false;
  }
  if (!isOldUrlValid && isNewUrlValid) {
    await prismaArticles.publication.update({
      where: { id: Number(publicationId) },
      data: { customDomain },
    });
  }
}

export async function getPublicationByIds(publicationIds: string[]) {
  const publications = await prismaArticles.post.findMany({
    where: { id: { in: publicationIds } },
  });
  return publications;
}
