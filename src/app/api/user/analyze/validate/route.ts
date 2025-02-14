// Validate the user's url first, make sure it's not 404.

import { getArticleEndpoint } from "@/lib/utils/publication";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("q");

    if (!url) {
      throw new Error("URL is required");
    }
    const endpointToValidate = getArticleEndpoint(url, 0, 1);
    const response = await fetch(endpointToValidate);
    const status = response.ok;
    if (!status) {
      throw new Error("URL is not valid");
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "URL is not valid" }, { status: 400 });
  }
}
