import { prismaArticles } from "@/app/api/_db/db";
import { Article, ArticleWithBody } from "@/models/article";
import { Post } from "../../../prisma/generated/articles";
import { getSubstackArticleData } from "@/lib/dal/milvus";

export const getUserArticles = async (
  data:
    | {
        publicationId: number;
      }
    | {
        url: string;
      },
  limit: number = 10,
): Promise<Article[]> => {
  let posts: Post[] = [];
  if ("url" in data) {
    const startsWith = data.url.includes("http")
      ? data.url
      : `https://${data.url}`;

    posts = await prismaArticles.post.findMany({
      where: {
        canonicalUrl: {
          contains: startsWith,
        },
      },
      take: limit,
    });
  } else {
    posts = await prismaArticles.post.findMany({
      where: {
        publicationId: data.publicationId.toString(),
      },
      take: limit,
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
  limit: number = 10,
): Promise<ArticleWithBody[]> => {
  const posts = await getUserArticles(data, limit);
  const urls = posts.map(post => post.canonicalUrl || "");
  const content = await getSubstackArticleData(urls);

  return posts.map((post: Article) => ({
    ...post,
    body_text:
      content.find(item => item.url === post.canonicalUrl)?.content || "",
  }));
};
