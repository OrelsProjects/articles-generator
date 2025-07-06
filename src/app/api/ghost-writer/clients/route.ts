import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/auth/authOptions";
import { prisma } from "@/lib/prisma";
import loggerServer from "@/loggerServer";
import { GhostwriterClient } from "@/types/ghost-writer";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First, get the user's ghostwriter profile
    const ghostwriter = await prisma.ghostwriter.findUnique({
      where: { userId: session.user.id },
    });

    if (!ghostwriter) {
      return NextResponse.json([]); // Return empty array if no ghostwriter profile
    }

    // Get all clients where this user is the ghostwriter
    const clientAccess = await prisma.ghostwriterAccess.findMany({
      where: {
        ghostwriterId: ghostwriter.id,
      },
      include: {
        accountUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    const clients: GhostwriterClient[] = clientAccess.map((access) => ({
      id: access.id,
      accountUserId: access.accountUserId,
      accountUserName: access.accountUser.name || "Unknown",
      accountUserEmail: access.accountUser.email || "",
      accountUserImage: access.accountUser.image || "",
      accessLevel: access.accessLevel,
      isActive: access.isActive,
      createdAt: access.createdAt.toISOString(),
      updatedAt: access.updatedAt.toISOString(),
    }));

    return NextResponse.json(clients);
  } catch (error) {
    loggerServer.error("Error getting ghostwriter clients", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { accessId } = await request.json();

    if (!accessId) {
      return NextResponse.json({ error: "Access ID required" }, { status: 400 });
    }

    // First, get the user's ghostwriter profile
    const ghostwriter = await prisma.ghostwriter.findUnique({
      where: { userId: session.user.id },
    });

    if (!ghostwriter) {
      return NextResponse.json({ error: "Ghostwriter profile not found" }, { status: 404 });
    }

    // Verify the access belongs to this ghostwriter
    const access = await prisma.ghostwriterAccess.findUnique({
      where: {
        id: accessId,
        ghostwriterId: ghostwriter.id,
      },
    });

    if (!access) {
      return NextResponse.json({ error: "Access not found" }, { status: 404 });
    }

    // Set isActive to false (stop ghostwriting)
    const updatedAccess = await prisma.ghostwriterAccess.update({
      where: { id: accessId },
      data: { isActive: false },
      include: {
        accountUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    const client: GhostwriterClient = {
      id: updatedAccess.id,
      accountUserId: updatedAccess.accountUserId,
      accountUserName: updatedAccess.accountUser.name || "Unknown",
      accountUserEmail: updatedAccess.accountUser.email || "",
      accountUserImage: updatedAccess.accountUser.image || "",
      accessLevel: updatedAccess.accessLevel,
      isActive: updatedAccess.isActive,
      createdAt: updatedAccess.createdAt.toISOString(),
      updatedAt: updatedAccess.updatedAt.toISOString(),
    };

    return NextResponse.json(client);
  } catch (error) {
    loggerServer.error("Error stopping ghostwriting", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 