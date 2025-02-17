import prisma, { prismaArticles } from "@/app/api/_db/db";
import { Article, ArticleWithBody } from "@/types/article";
import { Post } from "../../../prisma/generated/articles";
import { getSubstackArticleData } from "@/lib/dal/milvus";

export interface GetArticlesOptionsOrder {
  by: "reactionCount" | "publishedAt";
  direction: "asc" | "desc";
}

export interface GetUserArticlesOptions {
  limit?: number;
  freeOnly?: boolean;
  order?: GetArticlesOptionsOrder;
  select?: (keyof Post)[];
}

export const getUserArticles = async (
  data:
    | {
        publicationId: number;
      }
    | {
        url: string;
      }
    | {
        userId: string;
      },
  options: GetUserArticlesOptions = {
    limit: 10,
    freeOnly: true,
  },
): Promise<Article[]> => {
  let posts: Post[] = [];

  const postsWhere = {
    ...(options.freeOnly && {
      audience: "everyone",
    }),
  };

  const queryOptions = {
    take: options.limit || 9999,
    orderBy: options.order
      ? {
          [options.order.by]: options.order.direction,
        }
      : undefined,
    select: options.select
      ? Object.fromEntries(options.select.map(column => [column, true]))
      : undefined,
  };

  if ("url" in data) {
    const startsWith = data.url.includes("http")
      ? data.url
      : `https://${data.url}`;

    posts = await prismaArticles.post.findMany({
      where: {
        canonicalUrl: {
          startsWith: startsWith,
        },
        ...postsWhere,
      },
      ...queryOptions,
    });
  } else if ("publicationId" in data) {
    posts = await prismaArticles.post.findMany({
      where: {
        publicationId: data.publicationId.toString(),
        ...postsWhere,
      },
      ...queryOptions,
    });
  } else if ("userId" in data) {
    const publication = await prisma.userMetadata.findMany({
      where: {
        userId: data.userId,
      },
      select: {
        publication: {
          select: {
            idInArticlesDb: true,
          },
        },
      },
    });
    if (publication.length === 0) {
      return [];
    }
    posts = await prismaArticles.post.findMany({
      where: {
        publicationId:
          publication[0].publication?.idInArticlesDb?.toString() || "",
      },
      ...queryOptions,
    });
  }

  return posts.map(post => ({
    ...post,
    canonicalUrl: post.canonicalUrl || "",
  }));
};

export const getUserArticlesWithBody = async (
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
): Promise<ArticleWithBody[]> => {
  const posts = await getUserArticles(data, options);
  const postsWithoutBody = posts.filter(post => !post.bodyText);
  if (postsWithoutBody.length > 0) {
    const postsWithBody = await getUserArticlesBody(postsWithoutBody);
    return posts.map(post => ({
      ...post,
      bodyText:
        postsWithBody.find(p => p.canonicalUrl === post.canonicalUrl)
          ?.bodyText || "",
    }));
  }
  return posts.map(post => ({
    ...post,
    bodyText: post.bodyText || "",
  }));
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
