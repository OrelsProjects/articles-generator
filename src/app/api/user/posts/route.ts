import { prisma } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { getAuthorId } from "@/lib/dal/publication";
import { canUseFeature } from "@/lib/plans-consts";
import { getWriterPosts } from "@/lib/publication";
import loggerServer from "@/loggerServer";
import { FeatureFlag } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const page = request.nextUrl.searchParams.get("page") || "1";
    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!userMetadata) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // const isAllowed = canUseFeature(
    //   userMetadata,
    //   FeatureFlag.advancedFiltering,
    // );

    // if (!isAllowed) {
    //   loggerServer.error("User is not allowed to use advanced filtering", {
    //     userId: session.user.id,
    //     userMetadata,
    //   });
    //   return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    // }

    const authorId = await getAuthorId(session.user.id);
    if (!authorId) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }
    const pageSize = 30; // Show 30 articles per page

    // This should ideally call a function that fetches only articles, not all writer data
    // Let's assume getWriterPosts exists in the publication lib
    const articles = await getWriterPosts(authorId, Number(page), pageSize);

    const hasMore = articles.length >= pageSize;

    return NextResponse.json({
      articles,
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
