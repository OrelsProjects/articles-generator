import { prismaArticles } from "@/app/api/_db/db";
import { toValidUrl, validateUrl } from "@/lib/utils/url";
import loggerServer from "@/loggerServer";
import axios from "axios";
import * as cheerio from "cheerio";
import TurndownService from "turndown";

export type Filter = {
  leftSideValue: string;
  rightSideValue: string;
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=";
};

interface SearchOptions {
  query: string;
  limit?: number;
  includeBody?: boolean;
  filters?: Filter[];
}

interface ArticleContent {
  url: string;
  content: string;
  author?: {
    name: string;
    url: string | null;
  } | null;
}

async function getSubstackArticleData(
  urls: string[],
): Promise<ArticleContent[]> {
  const data: ArticleContent[] = [];
  const turndownService = new TurndownService();

  // Author selectors in order of preference
  const authorSelectors = [
    // Profile hover card target (new style)
    ".profile-hover-card-target a, .profileHoverCardTarget-PBxvGm a",
    // Meta section with author link
    ".meta-EgzBVA a",
    // Generic author link patterns
    'a[href*="/@"], a[href*="/p/"][href*="/by/"]',
    // Fallback to any element with author metadata
    '[data-author], [itemprop="author"]',
  ];

  for (const url of urls) {
    try {
      const isValidUrl = validateUrl(url);
      const validUrl = isValidUrl ? url : toValidUrl(url);
      let response: any | null = null;
      const maxRetries = 3;
      const retryDelay = 1000;
      let retryCount = 0;
      while (retryCount < maxRetries) {
        try {
          response = await axios.get(validUrl);
          console.log(`Fetched article from ${url}`);
          break;
        } catch (error: any) {
          loggerServer.error(`Failed to fetch article from ${url}:`, error);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

      if (!response) {
        loggerServer.error(
          `Failed to fetch article from ${url} after ${maxRetries} attempts`,
        );
        data.push({ url, content: "" });
        continue;
      }
      const html = response.data;
      const $ = cheerio.load(html);

      // Extract author information using multiple selectors
      let authorName = "";
      let authorUrl = "";

      // Try each selector until we find a match
      for (const selector of authorSelectors) {
        const authorElement = $(selector).first();
        if (authorElement.length) {
          authorName = authorElement.text().trim();
          authorUrl = authorElement.attr("href") || "";

          // If we found a name, try to clean it up
          if (authorName) {
            // Remove any "By" prefix
            authorName = authorName.replace(/^By\s+/i, "");
            // Remove any extra whitespace
            authorName = authorName.replace(/\s+/g, " ").trim();
            break;
          }
        }
      }

      // If we still don't have an author, try looking for structured data
      if (!authorName) {
        const structuredData = $('script[type="application/ld+json"]');
        structuredData.each((_, element) => {
          try {
            const data = JSON.parse($(element).html() || "");
            if (data.author?.name) {
              authorName = data.author.name;
              authorUrl = data.author.url || "";
            }
          } catch (error: any) {
            loggerServer.warn("Failed to parse structured data:", error);
          }
        });
      }

      // Validate and format author URL
      if (authorUrl) {
        // Ensure URL is absolute
        if (!authorUrl.startsWith("http")) {
          const baseUrl = new URL(url).origin;
          authorUrl = new URL(authorUrl, baseUrl).toString();
        }
        // Ensure it's a valid URL
        try {
          new URL(authorUrl);
        } catch (error: any) {
          authorUrl = "";
        }
      }

      // Remove unnecessary elements
      $(
        "script, style, noscript, iframe, form, button, .ads, .subscribe, .newsletter, .comments, .related-articles",
      ).remove();

      // Try to get the main article container
      let article = $("article");
      if (!article.length) {
        article = $("main");
      }
      if (!article.length) {
        article = $("body");
      }

      // Directly target the available-content div within the article
      const availableContent = article.find("div.available-content");
      if (availableContent.length) {
        article = availableContent;
      }

      const markdown = turndownService.turndown(article.html() || "");
      data.push({
        url,
        content: markdown,
        author: authorName
          ? {
              name: authorName,
              url: authorUrl || null,
            }
          : null,
      });
    } catch (error: any) {
      loggerServer.error(`Failed to fetch article from ${url}:`, error);
      data.push({
        url,
        content: "",
        author: null,
      });
    }
  }

  return data;
}

export async function searchSimilarArticles({
  query,
  limit = 20,
  includeBody = false,
  filters = [],
}: SearchOptions) {
  const MILVUS_API_KEY = process.env.MILVUS_API_KEY;
  const MILVUS_ENDPOINT = process.env.MILVUS_ENDPOINT;

  if (!MILVUS_API_KEY || !MILVUS_ENDPOINT) {
    throw new Error("Missing Milvus configuration");
  }

  const embedEndpoint = process.env.EMBED_LAMBDA_URL as string;

  // Generate embedding for the search query
  const embeddingResponse = await axios.post(embedEndpoint, {
    text: query,
  });

  const embedding = embeddingResponse.data.embedding;

  // Prepare Milvus API request
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${MILVUS_API_KEY}`,
    "Content-Type": "application/json",
  };

  const filtersString = filters
    .map(
      filter =>
        `${filter.leftSideValue} ${filter.operator} ${filter.rightSideValue}`,
    )
    .join(" AND ");

  const searchBody = {
    collectionName: "articles_substack",
    data: [embedding],
    limit: limit,
    outputFields: ["*"],
    filters: filtersString,
  };

  // Search vectors in Milvus
  console.time("Search milvus");
  const response = await fetch(
    `${MILVUS_ENDPOINT}/v2/vectordb/entities/search`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify(searchBody),
    },
  );
  console.timeEnd("Search milvus");

  if (!response.ok) {
    throw new Error(`Milvus search failed: ${response.statusText}`);
  }

  const data = await response.json();
  const topArticles = data.data ? data.data.slice(0, limit) : [];

  // Fetch articles from database
  console.time("Search db");
  const articles = await prismaArticles.post.findMany({
    where: {
      id: {
        in: topArticles.map((post: any) => post.id),
      },
    },
  });
  console.timeEnd("Search db");

  if (!includeBody) {
    return articles;
  }

  // If body content is requested, fetch it
  const urls = articles.map(article => article.canonicalUrl || "");
  if (!urls) {
    return [];
  }
  const content = await getSubstackArticleData(urls);

  return articles.map(article => ({
    ...article,
    body_text: content.find(item => item.url === article.canonicalUrl)?.content,
  }));
}

export { getSubstackArticleData };
