import { prismaArticles } from "@/app/api/_db/db";
import { toValidUrl, validateUrl } from "@/lib/utils/url";
import axios from "axios";
import * as cheerio from "cheerio";
import TurndownService from "turndown";

interface SearchOptions {
  query: string;
  limit?: number;
  includeBody?: boolean;
}

interface Article {
  id: string;
  canonical_url: string;
  title: string;
  subtitle?: string;
  body_text?: string;
}

interface ArticleContent {
  url: string;
  content: string;
}

async function getSubstackArticleData(
  urls: string[],
): Promise<ArticleContent[]> {
  const data: ArticleContent[] = [];
  const turndownService = new TurndownService();

  for (const url of urls) {
    try {
      const isValidUrl = validateUrl(url);
      const validUrl = isValidUrl ? url : toValidUrl(url);
      const response = await axios.get(validUrl);
      const html = response.data;
      const $ = cheerio.load(html);

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
      data.push({ url, content: markdown });
    } catch (error) {
      console.error(`Failed to fetch article from ${url}:`, error);
      data.push({ url, content: "" });
    }
  }

  return data;
}

export async function searchSimilarArticles({
  query,
  limit = 20,
  includeBody = false,
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

  const searchBody = {
    collectionName: "articles_substack",
    data: [embedding],
    limit: limit,
    outputFields: ["*"],
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
