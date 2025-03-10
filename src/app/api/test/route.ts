import { NextResponse } from "next/server";

export async function GET() {
  const scrapeAllArticlesUrl = process.env.TRIGGER_LAMBDAS_LAMBDA_URL;
  if (scrapeAllArticlesUrl) {
    // Run the lambda to scrape all articles and forget about it
    void fetch(scrapeAllArticlesUrl, {
      method: "POST",
      body: JSON.stringify({
        lambdaName: "substack-scraper",
        body: {
          url: "https://news.tonydinh.com/",
          includeBody: "true",
        },
      }),
    });
  }
  return NextResponse.json({ message: "Lambda triggered" });
}
