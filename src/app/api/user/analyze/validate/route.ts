// Validate the user's url first, make sure it's not 404.

import { getPublicationByUrl } from "@/lib/dal/publication";
import { getArticleEndpoint } from "@/lib/utils/publication";
import { getUrlComponents } from "@/lib/utils/url";
import loggerServer from "@/loggerServer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { url } = await request.json();
  try {
    loggerServer.info("[INFO-URL] Validating publication: " + url);

    if (!url) {
      loggerServer.error("URL is required");
      throw new Error("URL is required");
    }

    const { validUrl } = getUrlComponents(url);

    const responseBody: {
      valid: boolean;
      validUrl?: string;
      hasPublication: boolean;
    } = {
      valid: false,
      hasPublication: false,
    };

    const endpointToValidate = getArticleEndpoint(validUrl, 0, 1);
    const response = await fetch(endpointToValidate);
    if (!response.ok) {
      loggerServer.warn("[INFO-URL] URL is not valid: " + validUrl);
      throw new Error("URL is not valid");
    }

    // const updatedUrlResponse = await getPublicationUpdatedUrl(validUrl);
    const publicationInDB = await getPublicationByUrl(validUrl, {
      createIfNotFound: true,
    });

    responseBody.hasPublication = publicationInDB.length > 0;
    responseBody.valid = true;
    responseBody.validUrl = validUrl;

    return NextResponse.json(responseBody);
  } catch (error: any) {
    loggerServer.error("[ERROR-URL] URL is not valid: " + error);
    return NextResponse.json({ error: "URL is not valid" }, { status: 400 });
  }
}
