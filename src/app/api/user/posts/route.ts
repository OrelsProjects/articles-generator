import { prisma } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { getAuthorId } from "@/lib/dal/publication";
import { canUseFeature } from "@/lib/plans-consts";
import { getWriterPosts } from "@/lib/publication";
import { Logger } from "@/logger";
import loggerServer from "@/loggerServer";
import { FeatureFlag } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // const session = await getServerSession(authOptions);
  // if (!session) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }
  const userId = "680e689d9166e8e606843a61";
  try {
    const page = request.nextUrl.searchParams.get("page") || "1";
    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        // userId: session.user.id,
        userId,
      },
    });

    if (!userMetadata) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const authorId = await getAuthorId(userId);
    if (!authorId) {
      Logger.error("Author not found", {
        userId,
      });
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }
    const pageSize = 30; // Show 30 articles per page

    Logger.info("Fetching writer posts", {
      authorId,
      page,
      pageSize,
    });
    const articles = await getWriterPosts(authorId, Number(page), pageSize);

    const uniqueArticles = articles.filter(
      (article, index, self) =>
        index === self.findIndex(t => t.id === article.id),
    );

    const hasMore = uniqueArticles.length >= pageSize;

    return NextResponse.json({
      articles: uniqueArticles,
      hasMore,
    });
  } catch (error) {
    loggerServer.error("Failed to fetch writer posts", { error });
    return NextResponse.json(
      { error: "Failed to fetch writer posts" },
      { status: 500 },
    );
  }
}
