import { authOptions } from "@/auth/authOptions";
import { getByline } from "@/lib/dal/byline";
import { getAuthorId } from "@/lib/dal/publication";
import { getWriter } from "@/lib/publication";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { page: pageString } = await request.json();
    let page = parseInt(pageString);
    if (isNaN(page)) {
      page = 1;
    }
    const authorId = await getAuthorId(session.user.id);
    if (!authorId) {
      loggerServer.error("[GET-WRITER-DATA] Author ID not found", {
        userId: session.user.id,
      });
      return NextResponse.json(
        { error: "Author ID not found" },
        { status: 400 },
      );
    }
    const byline = await getByline(authorId);
    if (!byline?.handle) {
      loggerServer.error("[GET-WRITER-DATA] Byline not found", {
        userId: session.user.id,
      });
      return NextResponse.json({ error: "Byline not found" }, { status: 400 });
    }
    const writer = await getWriter(byline.handle, page, 30);
    return NextResponse.json({ writer });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
