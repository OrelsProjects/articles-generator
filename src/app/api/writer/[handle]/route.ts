import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import { canUseFeature } from "@/lib/plans-consts";
import { getWriter } from "@/lib/publication";
import loggerServer from "@/loggerServer";
import { FeatureFlag } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: {
      handle: string;
    };
  },
) {
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

    const isAllowed = canUseFeature(userMetadata, FeatureFlag.canViewWriters);

    if (!isAllowed) {
      loggerServer.error("User is not allowed to use advanced filtering", {
        userId: session.user.id,
        userMetadata,
      });
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const handle = params.handle;

    loggerServer.info("[WRITER] Fetching writer", {
      handle,
      page,
      userId: session.user.id,
    });
    loggerServer.time("Fetching writer");
    const writer = await getWriter(handle, Number(page), 30);
    loggerServer.timeEnd("Fetching writer");
    const hasMore = writer.topArticles.length >= 30;

    return NextResponse.json({
      writer,
      hasMore,
    });

  } catch (error) {
    loggerServer.error("Failed to fetch writer", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Failed to fetch writer" },
      { status: 500 },
    );
  }
}
