import { toValidUrl } from "@/lib/utils/url";
import loggerServer from "@/loggerServer";
import { PublicationNotFoundError } from "@/types/errors/PublicationNotFoundError";
import * as cheerio from "cheerio";
import axios from "axios";

export async function extractContent(url: string) {
  try {
    const validUrl = toValidUrl(url);
    const html = await axios.get(validUrl);
    const $ = cheerio.load(html.data);
    // Extract the first image URL from the <img> tag inside the <picture> element
    const imageUrl = $("picture img").first().attr("src") || "";

    // Find the closest <h1> and <p> tags after the <picture> element
    const pictureElement = $("picture").first();
    const title = pictureElement.nextAll("h1").first().text().trim();
    const description = pictureElement.nextAll("p").first().text().trim();

    return {
      image: imageUrl,
      title,
      description,
    };
  } catch (error: any) {
    loggerServer.error("Error extracting content:", {
      error,
      userId: "none",
    });
    throw new PublicationNotFoundError(
      "The publication was not found. Please check your URL and try again.",
    );
  }
}

const axiosInstance = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  },
});

const grab = (blob: string, key: string): string | null => {
  // matches "key":"some value" or "key":null  (no nested objects, keep it simple)
  const re = new RegExp(`"${key}"\\s*:\\s*("(?:[^"\\\\]|\\\\.)*"|null)`);
  const m = blob.match(re);
  if (!m) return null;
  const raw = m[1];
  if (raw === "null") return null;
  // slice off the quotes and unescape
  return JSON.parse(raw);
};

export async function extractPostContent(url: string) {
  const html = (await axiosInstance.get(url)).data as string;
  // yank out the JSON.parse("...") blob
  const m = html.match(
    /window\._preloads\s*=\s*JSON\.parse\((['"])([\s\S]+?)\1\)/,
  );
  if (!m) {
    throw new Error("Couldn’t find that blasted _preloads blob");
  }

  let literal = m[2];

  // unescape the JS string literal into real JSON
  const unescapedOnce = literal
    .replace(/\\\\/g, "\\") // \\ → \
    .replace(/\\"/g, '"') // \" → "
    .replace(/\\n/g, "\n") // \n → newline
    .replace(/\\r/g, "\r") // \r → carriage return
    .replace(/\\t/g, "\t"); // \t → tab

  // dig what we need
  const title = grab(unescapedOnce, "title") ?? "";
  const subtitle =
    grab(unescapedOnce, "subtitle") ?? grab(unescapedOnce, "description") ?? "";
  const bodyHtml = grab(unescapedOnce, "body_html") ?? "";
  const coverImg = grab(unescapedOnce, "cover_image");

  return { title, subtitle, content: bodyHtml, image: coverImg };
}
