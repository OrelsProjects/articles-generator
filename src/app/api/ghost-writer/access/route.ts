import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const addAccessSchema = z.object({
  ghostwriterToken: z.string(),
  accessLevel: z.enum(["full", "editor"]).optional().default("editor"),
});

const updateAccessSchema = z.object({
  ghostwriterId: z.string(),
  accessLevel: z.enum(["full", "editor"]),
  isActive: z.boolean(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const parsed = addAccessSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { ghostwriterToken, accessLevel } = parsed.data;

    // Find the ghostwriter by token
    const ghostwriter = await prisma.ghostwriter.findUnique({
      where: { token: ghostwriterToken },
    });

    if (!ghostwriter) {
      return NextResponse.json({ error: "Invalid ghostwriter token" }, { status: 400 });
    }

    // Check if access already exists
    const existingAccess = await prisma.ghostwriterAccess.findUnique({
      where: {
        accountUserId_ghostwriterId: {
          accountUserId: session.user.id,
          ghostwriterId: ghostwriter.id,
        },
      },
    });

    if (existingAccess) {
      return NextResponse.json({ error: "Access already exists" }, { status: 409 });
    }

    // Create new access
    const ghostwriterAccess = await prisma.ghostwriterAccess.create({
      data: {
        accountUserId: session.user.id,
        ghostwriterId: ghostwriter.id,
        accessLevel,
        isActive: true,
      },
      include: {
        ghostWriter: true,
      },
    });

    return NextResponse.json(ghostwriterAccess);
  } catch (error) {
    loggerServer.error("Error creating ghostwriter access", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const parsed = updateAccessSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { ghostwriterId, accessLevel, isActive } = parsed.data;

    // Update access
    const ghostwriterAccess = await prisma.ghostwriterAccess.update({
      where: {
        accountUserId_ghostwriterId: {
          accountUserId: session.user.id,
          ghostwriterId,
        },
      },
      data: {
        accessLevel,
        isActive,
      },
      include: {
        ghostWriter: true,
      },
    });

    return NextResponse.json(ghostwriterAccess);
  } catch (error) {
    loggerServer.error("Error updating ghostwriter access", {
      error,
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
  try {
    const { searchParams } = new URL(request.url);
    const ghostwriterId = searchParams.get("ghostwriterId");

    if (!ghostwriterId) {
      return NextResponse.json({ error: "Ghostwriter ID required" }, { status: 400 });
    }

    // Delete access
    await prisma.ghostwriterAccess.delete({
      where: {
        accountUserId_ghostwriterId: {
          accountUserId: session.user.id,
          ghostwriterId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    loggerServer.error("Error deleting ghostwriter access", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
