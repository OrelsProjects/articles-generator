// Validate the user's url first, make sure it's not 404.

import { getPublicationByUrl } from "@/lib/dal/publication";
import { getArticleEndpoint } from "@/lib/utils/publication";
import { toValidUrl } from "@/lib/utils/url";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("q");

    if (!url) {
      throw new Error("URL is required");
    }

    const validUrl = toValidUrl(url);

    const endpointToValidate = getArticleEndpoint(validUrl, 0, 1);
    const response = await fetch(endpointToValidate);
    const status = response.ok;
    if (!status) {
      throw new Error("URL is not valid");
    }

    const publicationInDB = await getPublicationByUrl(validUrl);

    return NextResponse.json({
      valid: true,
      hasPublication: publicationInDB.length > 0,
    });
  } catch (error) {
    return NextResponse.json({ error: "URL is not valid" }, { status: 400 });
  }
}
