import { prisma, prismaArticles } from "@/lib/prisma";
import { Article, ArticleWithBody } from "@/types/article";
import { Post } from "../../../prisma/generated/articles";
import { ArticleContent } from "@/lib/dal/milvus";
import { getSubstackArticleData } from "@/lib/utils/article";

export interface GetArticlesOptionsOrder {
  by: "reactionCount" | "postDate" | "audience";
  direction: "asc" | "desc";
}

export interface GetUserArticlesOptions {
  limit?: number;
  freeOnly?: boolean;
  order?: GetArticlesOptionsOrder;
  select?: (keyof Post)[];
  scrapeIfNotFound?: boolean;
  includeBody?: boolean;
}

export const getUserArticlesByUserId = async (
  userId: string,
  options: GetUserArticlesOptions = {
    limit: 10,
    includeBody: true,
  },
) => {
  const queryOptions = {
    take: options.limit || 300,
    orderBy: options.order
      ? {
          [options.order.by]: options.order.direction,
        }
      : undefined,
    select: options.select
      ? Object.fromEntries(options.select.map(column => [column, true]))
      : undefined,
  };

  const userMetadata = await prisma.userMetadata.findUnique({
    where: {
      userId: userId,
    },
    select: {
      publication: {
        select: {
          authorId: true,
        },
      },
    },
  });
  if (!userMetadata || !userMetadata.publication) {
    return [];
  }

  const userPublications = await prismaArticles.publication.findMany({
    where: {
      authorId: userMetadata.publication.authorId,
    },
  });

  const publicationIds = userPublications.map(it => it.id);

  const posts = await prismaArticles.post.findMany({
    where: {
      publicationId: {
        in: publicationIds.map(it => it.toString()),
      },
    },
    ...queryOptions,
  });

  return posts;
};

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
      }
    | {
        authorId: number;
        url: string;
      },
  options: GetUserArticlesOptions = {
    limit: 10,
    includeBody: true,
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
    take: options.limit || 300,
    orderBy: options.order
      ? {
          [options.order.by]: options.order.direction,
        }
      : undefined,
    select: options.select
      ? Object.fromEntries(options.select.map(column => [column, true]))
      : undefined,
  };

  if ("authorId" in data && !isNaN(data.authorId)) {
    const publication = await prismaArticles.publication.findMany({
      where: {
        authorId: data.authorId,
      },
    });
    if (publication.length === 0) {
      return [];
    }

    const startsWith = data.url.includes("http")
      ? data.url
      : `https://${data.url}`;
    const validPublication =
      publication.find(p =>
        startsWith.includes(p.subdomain || p.customDomain || ""),
      ) || publication[0];

    posts = await prismaArticles.post.findMany({
      where: {
        publicationId: validPublication.id.toString(),
      },
      ...queryOptions,
    });
  } else if ("url" in data) {
    const startsWith = data.url.includes("http")
      ? data.url
      : `https://${data.url}`;

    posts = await prismaArticles.post.findMany({
      where: {
        canonicalUrl: {
          startsWith,
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
    posts = await getUserArticlesByUserId(data.userId, options);
  }

  if (!options.includeBody) {
    return posts.map(post => {
      const { bodyText, ...rest } = post;
      return {
        ...rest,
        bodyText: "",
        canonicalUrl: post.canonicalUrl || "",
      };
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
    const postsWithBody = await getUserArticlesBody(
      postsWithoutBody.map(it => ({
        canonicalUrl: it.canonicalUrl,
        id: Number(it.id),
        bodyText: it.bodyText || "", // Add default empty string to fix type error
      })),
    );
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

export const getUserArticlesBody = async (
  posts: { canonicalUrl: string; id: number; bodyText: string }[],
): Promise<{ canonicalUrl: string; id: number; bodyText: string }[]> => {
  const urlsWithoutBody = posts
    .filter(article => !article.bodyText)
    .map(article => article.canonicalUrl || "")
    .filter(url => url !== "");
  const content = await getSubstackArticleData(urlsWithoutBody);

  return posts.map(post => ({
    ...post,
    bodyText:
      content.find((item: ArticleContent) => item.url === post.canonicalUrl)
        ?.content || "",
  }));
};
