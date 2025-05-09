import { prisma } from "../prisma";
export async function fetchAuthor(options: {
  authorId?: string;
  publicationUrl?: string;
  publicationId?: string;
  updateUserInDB?: {
    userId: string;
  };
}) {
  const scrapeAllArticlesUrl = process.env.TRIGGER_LAMBDAS_LAMBDA_URL;
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
}
