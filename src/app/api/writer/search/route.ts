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

    console.time("searchByline");
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
    console.timeEnd("searchByline");
    return NextResponse.json(response);
  } catch (error: any) {
    loggerServer.error(error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
