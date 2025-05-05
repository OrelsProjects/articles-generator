// Validate the user's url first, make sure it's not 404.

import { getPublicationByUrl } from "@/lib/dal/publication";
import { getPublicationUpdatedUrl } from "@/lib/publication";
import { getArticleEndpoint } from "@/lib/utils/publication";
import { getUrlComponents, toValidUrl } from "@/lib/utils/url";
import { Logger } from "@/logger";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("q");

    if (!url) {
      Logger.error("URL is required");
      throw new Error("URL is required");
    }

    const { validUrl } = getUrlComponents(url, { withoutWWW: true });

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
      throw new Error("URL is not valid");
    }

    const updatedUrlResponse = await getPublicationUpdatedUrl(validUrl);
    const publicationInDB = await getPublicationByUrl(validUrl, {
      createIfNotFound: true,
    });

    responseBody.hasPublication = publicationInDB.length > 0;
    responseBody.valid = true;
    responseBody.validUrl = updatedUrlResponse;

    return NextResponse.json(responseBody);
  } catch (error: any) {
    Logger.error(error);
    return NextResponse.json({ error: "URL is not valid" }, { status: 400 });
  }
}
