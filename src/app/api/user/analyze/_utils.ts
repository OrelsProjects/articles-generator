import { toValidUrl } from "@/lib/utils/url";
import { PublicationNotFoundError } from "@/types/errors/PublicationNotFoundError";
import axios from "axios";
import * as cheerio from "cheerio";

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
  } catch (error) {
    console.error(error);
    throw new PublicationNotFoundError(
      "The publication was not found. Please check your URL and try again.",
    );
  }
}
