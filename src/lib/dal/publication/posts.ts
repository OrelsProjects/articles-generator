import { prismaArticles } from "@/lib/prisma";
import { scrapePosts } from "@/lib/utils/publication";
import { getUrlComponents } from "@/lib/utils/url";
import { PublicationDataResponse } from "@/types/publication";

export const getPublicationArticles = async (publicationId: string) => {
  const articles = await prismaArticles.post.findMany({
    where: {
      publicationId,
    },
  });

  return articles;
};

export const getPublicationPosts = async (values: {
  url: string;
  publicationId?: string;
}) => {
  let publicationId = values.publicationId;
  if (!publicationId) {
    const { validUrl } = getUrlComponents(values.url, { withoutWWW: true });
    const endpoint = `${validUrl}/api/v1/homepage_data`;
    const response = await fetch(endpoint);
    const data = (await response.json()) as PublicationDataResponse;
    for (const post of data.newPosts) {
      if (publicationId) {
        break;
      }
      publicationId = post.publication_id.toString();
    }
  }

  let posts = await prismaArticles.post.findMany({
    where: {
      publicationId,
    },
  });

  if (!posts) {
    await scrapePosts(values.url, 0);
    posts = await prismaArticles.post.findMany({
      where: {
        publicationId,
      },
    });
  }

  return posts;
};
