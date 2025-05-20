import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getByline } from "@/lib/dal/byline";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let tempAuthorId = session.user.meta?.tempAuthorId;
    if (!tempAuthorId) {
      const userMetadata = await prisma.userMetadata.findUnique({
        where: {
          userId: session.user.id,
        },
        select: {
          publication: true,
        },
      });
      tempAuthorId = userMetadata?.publication?.authorId?.toString() || null;
      if (!tempAuthorId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    const byline = await getByline(parseInt(tempAuthorId));
    return NextResponse.json({
      authorId: byline?.id,
      name: byline?.name,
      image: byline?.photoUrl,
      handle: byline?.handle,
      bio: byline?.bio,
    });
  } catch (error) {
    loggerServer.error("Error fetching user metadata", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
