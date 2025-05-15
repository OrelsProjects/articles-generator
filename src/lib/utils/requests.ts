import axiosInstance from "@/lib/axios-instance";
import { AxiosResponse } from "axios";

/**
 * List of rotating User-Agents for scraping
 */
const userAgents: string[] = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/110.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Version/16.1 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Mobile/15E148 Safari/604.1",
];

/**
 * Helper function to get a random User-Agent.
 */
function getRandomUserAgent(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Helper function to add a small delay (ms).
 */
export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch a URL with rotating User-Agent and retries.
 * Returns the `data` (HTML or JSON) if successful, otherwise `null`.
 */
export async function fetchWithHeaders(
  url: string,
  retries = 3,
  minDelay = 300,
  extraStatusesToRetry: number[] = [],
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Attempt ${attempt}] Fetching: ${url}`);

      // Ensure URL has a protocol
      const validUrl = url.startsWith("http") ? url : `https://${url}`;

      const response: AxiosResponse = await axiosInstance.get(validUrl, {
        headers: {
          "User-Agent": getRandomUserAgent(),
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://www.google.com/",
        },
      });

      const randomDelay = Math.floor(Math.random() * 250) + minDelay;
      await delay(randomDelay);
      return response.data;
    } catch (error: any) {
      console.error(
        `Error fetching ${url} (Attempt ${attempt}):`,
        error.response.data.code,
      );
      if (attempt === retries) {
        return null; // Give up after max retries
      }
      if (
        error.response?.status === 429 ||
        extraStatusesToRetry.includes(error.response?.status)
      ) {
        // Rate limit (429) - Exponential backoff
        const timeToWait = 5000 * attempt * attempt;
        console.log(
          `Rate limit exceeded, waiting ${timeToWait} ms before retrying`,
        );
        await delay(timeToWait);
      } else {
        return null;
      }
    }
  }
  return null;
}

export async function runWithRetry<T>(
  fn: (retryCount: number) => Promise<T>,
  fnFailed: (error: string) => void,
  options: { retries: number; delayTime: number } = {
    retries: 3,
    delayTime: 2000,
  },
) {
  for (let attempt = 0; attempt < options.retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (error: any) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      await delay(options.delayTime * attempt);
    }
  }
  throw new Error("All attempts failed");
}
