import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import loggerServer from "@/loggerServer";

export async function POST(
  request: NextRequest,
  { params }: { params: { authorId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { authorId } = params;

  const tempAuthorId = session.user.meta?.tempAuthorId;
  if (tempAuthorId) {
    return NextResponse.json(tempAuthorId, {
      status: 400,
    });
  }

  try {
    await prisma.userMetadata.update({
      where: {
        userId: session.user.id,
      },
      data: {
        tempAuthorId: parseInt(authorId),
      },
    });

    return NextResponse.json(tempAuthorId, { status: 200 });
  } catch (error) {
    loggerServer.error("Error updating temp author id for userId:", {
      error,
      userId: session.user.id,
      authorId,
    });
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
