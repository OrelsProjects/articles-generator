import { prismaArticles } from "@/app/api/_db/db";
import { Article, ArticleWithBody } from "@/types/article";
import { Post } from "../../../prisma/generated/articles";
import { getSubstackArticleData } from "@/lib/dal/milvus";

export interface GetUserArticlesOptions {
  limit: number;
  freeOnly: boolean;
}

export const getUserArticles = async (
  data:
    | {
        publicationId: number;
      }
    | {
        url: string;
      },
  options: GetUserArticlesOptions = {
    limit: 10,
    freeOnly: true,
  },
): Promise<Article[]> => {
  let posts: Post[] = [];
  if ("url" in data) {
    const startsWith = data.url.includes("http")
      ? data.url
      : `https://${data.url}`;

    posts = await prismaArticles.post.findMany({
      where: {
        canonicalUrl: {
          startsWith: startsWith,
        },
        ...(options.freeOnly && {
          audience: "everyone",
        }),
      },
      take: options.limit,
    });
  } else {
    posts = await prismaArticles.post.findMany({
      where: {
        publicationId: data.publicationId.toString(),
        ...(options.freeOnly && {
          audience: "everyone",
        }),
      },
      take: options.limit,
    });
  }

  return posts;
};

export const getUserArticlesWithBody = async (
  data:
    | {
        publicationId: number;
      }
    | {
        url: string;
      },
  options: {
    limit: number;
    freeOnly: boolean;
  } = {
    limit: 10,
    freeOnly: true,
  },
): Promise<ArticleWithBody[]> => {
  const posts = await getUserArticles(data, options);
  return getUserArticlesBody(posts);
};

export const getUserArticlesBody = async <T extends { canonicalUrl: string }>(
  posts: T[],
): Promise<(T & { bodyText: string })[]> => {
  const urls = posts.map(post => post.canonicalUrl);
  const content = await getSubstackArticleData(urls);

  return posts.map(post => ({
    ...post,
    bodyText:
      content.find(item => item.url === post.canonicalUrl)?.content || "",
  }));
};
