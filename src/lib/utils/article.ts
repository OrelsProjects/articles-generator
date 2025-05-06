import { ArticleContent } from "@/lib/dal/milvus";
import { validateUrl, toValidUrl } from "@/lib/utils/url";
import loggerServer from "@/loggerServer";
import axios from "axios";
import * as cheerio from "cheerio";
import TurndownService from "turndown";

export const cleanArticleBody = (body: string) => {
  // Remove nested image links with alt text and URLs
  // Remove standalone image markdown
  // Replace markdown links with just the text content
  // Replace raw URLs with <url>
  // Remove substack subscription text
  return body
    .replace(/\[[\s\n]*!\[.*?\]\(.*?\)[\s\n]*\]\(.*?\)/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "<alt>")
    .replace(/https?:\/\/[^\s<>]+/g, "<url>")
    .replace(/Thanks for reading.*?support my work[\s\S]*?/g, "")
    .trim();
};

export async function getSubstackArticleData(
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

  const delayBetweenUrls = 300;
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
          loggerServer.error(`Failed to fetch article from ${url}:`, {
            error,
            userId: "article",
          });
          retryCount++;
          await new Promise(resolve =>
            setTimeout(resolve, retryDelay * retryCount * retryCount),
          );
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
        structuredData.each((_: any, element: any) => {
          try {
            const data = JSON.parse($(element).html() || "");
            if (data.author?.name) {
              authorName = data.author.name;
              authorUrl = data.author.url || "";
            }
          } catch (error: any) {
            loggerServer.warn("Failed to parse structured data:", {
              error,
              userId: "article",
            });
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
      loggerServer.error(`Failed to fetch article from ${url}:`, {
        error,
        userId: "article",
      });
      data.push({
        url,
        content: "",
        author: null,
      });
    } finally {
      await new Promise(resolve => setTimeout(resolve, delayBetweenUrls));
    }
  }

  return data;
}
