import { NextRequest, NextResponse } from "next/server";
import { searchByline } from "@/lib/dal/byline";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { z } from "zod";
import { WriterSearchResult } from "@/types/writer";

const searchBylineSchema = z.object({
  query: z.string().min(1),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).default(10),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const parsed = searchBylineSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { query, page, limit } = parsed.data;

    const now = new Date();
    loggerServer.info("[WRITER SEARCH] Searching for writers", {
      query,
      page,
      limit,
      userId: session.user.id,
    });
    const results = await searchByline(query, page, limit);
    const response: WriterSearchResult[] = results
      .map(result => ({
        id: result.id.toString(),
        name: result.name || "",
        handle: result.handle || "",
        photoUrl: result.photoUrl || "",
        bio: result.bio || "",
        authorId: result.id.toString(),
      }))
      // prefer those with an image first
      .sort((a, b) => (b.photoUrl ? 1 : -1) - (a.photoUrl ? 1 : -1));
    const end = new Date();
    const timeToSearchSeconds = (end.getTime() - now.getTime()) / 1000;
    loggerServer.info(
      "[WRITER SEARCH] Found writers in" + timeToSearchSeconds + "seconds",
      {
        query,
        page,
        limit,
        userId: session.user.id,
      },
    );
  } catch (error: any) {
    loggerServer.error("[WRITER SEARCH] Error searching byline", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
