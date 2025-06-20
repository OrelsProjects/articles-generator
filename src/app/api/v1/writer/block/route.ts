import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const blockWriterSchema = z.object({
  authorId: z.string(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedBody = blockWriterSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { authorId } = parsedBody.data;

  try {
    await prisma.blockedWriters.upsert({
      where: {
        userId_authorId: {
          userId: session.user.id,
          authorId,
        },
      },
      update: {},
      create: {
        userId: session.user.id,
        authorId,
      },
    });

    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    loggerServer.error("[WRITER-BLOCK] Error blocking writer", {
      error,
      authorId,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedBody = blockWriterSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { authorId } = parsedBody.data;

  try {
    await prisma.blockedWriters.delete({
      where: {
        userId_authorId: {
          userId: session.user.id,
          authorId,
        },
      },
    });

    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    loggerServer.error("[WRITER-UNBLOCK] Error unblocking writer", {
      error,
      authorId,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
