import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { GhostwriterDAL } from "@/lib/dal/ghostwriter";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GhostwriterAccess } from "@/types/ghost-writer";

const addAccessSchema = z.object({
  ghostwriterToken: z.string(),
  accessLevel: z.enum(["full", "editor"]).optional().default("editor"),
});

const updateAccessSchema = z.object({
  ghostwriterUserId: z.string(),
  accessLevel: z.enum(["full", "editor"]),
  isActive: z.boolean(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const ghostwriters: GhostwriterAccess[] =
      await GhostwriterDAL.getAccessList(session.user.id);

    return NextResponse.json(ghostwriters);
  } catch (error) {
    loggerServer.error("Error getting ghostwriter access", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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
    const ghostwriter =
      await GhostwriterDAL.findGhostwriterByToken(ghostwriterToken);

    if (!ghostwriter) {
      return NextResponse.json(
        { error: "Invalid ghostwriter token" },
        { status: 400 },
      );
    }

    // Check if access already exists
    const existingAccess = await GhostwriterDAL.checkExistingAccess(
      session.user.id,
      ghostwriter.id,
    );

    const access: GhostwriterAccess | null = existingAccess
      ? {
          id: existingAccess.id,
          accountUserId: existingAccess.accountUserId,
          accessLevel: existingAccess.accessLevel,
          isActive: existingAccess.isActive,
          ghostwriter: {
            id: ghostwriter.id,
            name: ghostwriter.name,
            image: ghostwriter.image,
          },
          createdAt: existingAccess.createdAt.toISOString(),
          updatedAt: existingAccess.updatedAt.toISOString(),
        }
      : null;

    if (access) {
      return NextResponse.json(access, { status: 200 });
    }

    // Create new access
    const createAccessResponse = await GhostwriterDAL.createAccess({
      accountUserId: session.user.id,
      ghostwriterUserId: ghostwriter.userId,
      ghostwriterId: ghostwriter.id,
      accessLevel,
    });

    if (!createAccessResponse) {
      return NextResponse.json(
        { error: "Failed to create ghostwriter access" },
        { status: 500 },
      );
    }

    const ghostwriterAccess: GhostwriterAccess | null = {
      id: createAccessResponse.id,
      accountUserId: createAccessResponse.accountUserId,
      accessLevel: createAccessResponse.accessLevel,
      isActive: createAccessResponse.isActive,
      ghostwriter: {
        id: ghostwriter.id,
        name: ghostwriter.name,
        image: ghostwriter.image,
      },
      createdAt: createAccessResponse.createdAt.toISOString(),
      updatedAt: createAccessResponse.updatedAt.toISOString(),
    };

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
    const { ghostwriterUserId, accessLevel, isActive } = parsed.data;

    // Update access
    const ghostwriterAccess = await GhostwriterDAL.updateAccess(
      session.user.id,
      ghostwriterUserId,
      accessLevel,
      isActive,
    );

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
    const accessId = searchParams.get("accessId");

    if (!accessId) {
      return NextResponse.json(
        { error: "Access ID required" },
        { status: 400 },
      );
    }

    // Delete access
    await GhostwriterDAL.revokeAccess(accessId);

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
