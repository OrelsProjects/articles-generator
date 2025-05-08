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
      return NextResponse.json(
        { error: "User metadata not found" },
        { status: 404 },
      );
    }

    const { authorId, publicationUrl } = userMetadata.publication || {};

    if (shouldRefreshUserMetadata(userMetadata) && authorId && publicationUrl) {
      await fetchAuthor({
        authorId: authorId.toString(),
        publicationUrl,
        publicationId: userMetadata.publication?.idInArticlesDb?.toString(),
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
