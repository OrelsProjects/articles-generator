import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import loggerServer from "@/loggerServer";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!userMetadata) {
      return new Response("User not found", { status: 404 });
    }

    const shouldUpdate = userMetadata.notesLastUpdatedAt
      ? new Date(userMetadata.notesLastUpdatedAt) <
        new Date(Date.now() - 1000 * 60 * 60 * 24)
      : true;

    return NextResponse.json({ shouldUpdate });
  } catch (error: any) {
    loggerServer.error("Error getting user notes should update", {
      error: error.message,
      stack: error.stack,
      userId: session?.user?.id,
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
