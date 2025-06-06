import loggerServer from "@/loggerServer";
import { prisma } from "../prisma";

export async function fetchAuthor(options: {
  authorId?: string;
  publicationUrl?: string;
  publicationId?: string;
  updateUserInDB?: {
    userId: string;
  };
  throwIfFails?: boolean;
}) {
  try {
    const scrapeAllArticlesUrl = process.env.TRIGGER_LAMBDAS_LAMBDA_URL;
    const body = {
      url: options.publicationUrl,
      authorId: options.authorId,
      publicationId: options.publicationId,
    };
    if (options.authorId) {
      //delete url
      delete body.url;
    }
    if (scrapeAllArticlesUrl) {
      // Run the lambda to scrape all articles and forget about it
      void fetch(scrapeAllArticlesUrl, {
        method: "POST",
        body: JSON.stringify({
          lambdaName: "substack-scraper",
          body: {
            url: options.publicationUrl,
            authorId: options.authorId,
            publicationId: options.publicationId,
          },
        }),
      });
    }

    if (options?.updateUserInDB) {
      await prisma.userMetadata.update({
        where: { userId: options.updateUserInDB.userId },
        data: { dataUpdatedAt: new Date() },
      });
    }
  } catch (error: any) {
    loggerServer.error("Error fetching author", {
      error,
      authorId: options.authorId,
      publicationUrl: options.publicationUrl,
      publicationId: options.publicationId,
      userId: options.updateUserInDB?.userId || "unknown",
    });
    if (options?.throwIfFails) {
      throw error;
    }
  }
}
