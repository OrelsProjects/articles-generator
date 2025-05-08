import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import { shouldRefreshUserMetadata } from "@/lib/dal/analysis";
import { fetchAuthor } from "@/lib/utils/lambda";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const userMetadata = await prisma.userMetadata.findUnique({
      where: { userId: session.user.id },
      include: {
        publication: true,
      },
    });

    if (!userMetadata) {
      loggerServer.error("User metadata not found", {
        userId: session.user.id,
      });
      return NextResponse.json(
        { error: "User metadata not found" },
        { status: 404 },
      );
    }

    const { authorId, publicationUrl } = userMetadata.publication || {};

    const refreshUserMetadata = shouldRefreshUserMetadata(userMetadata);
    const publicationId = userMetadata.publication?.idInArticlesDb?.toString();
    loggerServer.info("Refreshing user metadata", {
      userId: session.user.id,
      refreshUserMetadata,
      authorId,
      publicationUrl,
      publicationId,
    });

    if (refreshUserMetadata && authorId && publicationUrl) {
      await fetchAuthor({
        authorId: authorId.toString(),
        publicationUrl,
        publicationId,
      });

      await prisma.userMetadata.update({
        where: { userId: session.user.id },
        data: { dataUpdatedAt: new Date() },
      });
    }

    return NextResponse.json(
      { message: "User metadata refreshed" },
      { status: 200 },
    );
  } catch (error) {
    loggerServer.error("Error refreshing user metadata", {
      error,
      userId: session?.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
