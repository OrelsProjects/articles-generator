import { getBylines } from "@/lib/publication";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }
  try {
    const bylines = await getBylines(url);
    return NextResponse.json(bylines);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch bylines" },
      { status: 500 },
    );
  }
}
