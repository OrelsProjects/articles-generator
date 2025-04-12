import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { fetchAuthor } from "@/lib/utils/lambda";
import loggerServer from "@/loggerServer";
import { UserMetadata } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// 24 hours passed?
const shouldRefreshUserMetadata = (userMetadata: UserMetadata) => {
  const now = new Date();
  const lastUpdatedAt = userMetadata.dataUpdatedAt;
  if (!lastUpdatedAt) {
    return true;
  }
  const diffTime = Math.abs(now.getTime() - lastUpdatedAt.getTime());
  const diffHours = diffTime / (1000 * 60 * 60);
  return diffHours > 24;
};

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
    loggerServer.error("Error refreshing user metadata", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
