import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import loggerServer from "@/loggerServer";

const schemaPost = z.object({
  message: z.string(),
  noteId: z.string(),
});

const schemaGet = z.object({
  noteId: z.string(),
});

const schemaUpdate = z.object({
  noteId: z.string(),
  message: z.string(),
  isActive: z.boolean(),
});

const schemaDelete = z.object({
  noteId: z.string(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const parsedBody = schemaPost.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { message, noteId } = parsedBody.data;

    await prisma.autoDMNote.upsert({
      where: {
        id: noteId,
      },
      update: {
        message,
        isActive: true,
      },
      create: {
        message,
        isActive: true,
        noteId,
        user: {
          connect: {
            id: session.user.id,
          },
        },
      },
    });
  } catch (error: any) {
    loggerServer.error(error, {
      message: "Error sending auto DM",
      error: error.message,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const parsedBody = schemaGet.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { noteId } = parsedBody.data;

    const autoDMNote = await prisma.autoDMNote.findUnique({
      where: {
        id: noteId,
      },
    });

    return NextResponse.json(autoDMNote, { status: 200 });
  } catch (error: any) {
    loggerServer.error(error, {
      message: "Error getting auto DM",
      error: error.message,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const parsedBody = schemaUpdate.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { noteId, message, isActive } = parsedBody.data;

    await prisma.autoDMNote.update({
      where: { id: noteId },
      data: { message, isActive },
    });

    return NextResponse.json({ message: "Auto DM updated" }, { status: 200 });
  } catch (error: any) {
    loggerServer.error(error, {
      message: "Error updating auto DM",
      error: error.message,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const parsedBody = schemaDelete.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { noteId } = parsedBody.data;

    await prisma.autoDMNote.update({
      where: { id: noteId },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Auto DM deleted" }, { status: 200 });
  } catch (error: any) {
    loggerServer.error(error, {
      message: "Error deleting auto DM",
      error: error.message,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
