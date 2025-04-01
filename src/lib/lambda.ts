export async function fetchAuthor(options: {
  authorId?: string;
  publicationUrl?: string;
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
        },
      }),
    });
  }
}
