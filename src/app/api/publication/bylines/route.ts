import { getBylinesByUrl } from "@/lib/publication";
import loggerServer from "@/loggerServer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { url } = await request.json();
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }
  try {
    const bylines = await getBylinesByUrl(url, { createIfNotExists: true });
    return NextResponse.json(bylines);
  } catch (error) {
    loggerServer.error("Failed to fetch bylines", { error, userId: "no-user" });
    return NextResponse.json(
      { error: "Failed to fetch bylines" },
      { status: 500 },
    );
  }
}
