import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/auth/authOptions";
import { prisma } from "@/lib/prisma";
import loggerServer from "@/loggerServer";
import { MyGhostwriter } from "@/types/ghost-writer";
import { generateToken } from "@/lib/utils/token";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const ghostwriterAccess = await prisma.ghostwriterAccess.findMany({
      where: {
        accountUserId: session.user.id,
      },
      include: {
        ghostWriter: true,
      },
    });
    const ghostwriters: MyGhostwriter[] = ghostwriterAccess.map(access => ({
      id: access.ghostWriter.id,
      name: access.ghostWriter.name || "Unknown",
      image: access.ghostWriter.image || "",
      accessLevel: access.accessLevel,
      isActive: access.isActive,
      token: access.ghostWriter.token,
    }));
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
    const { name, image } = await request.json();

    if (!name || !image) {
      return NextResponse.json(
        { error: "Name and image are required" },
        { status: 400 },
      );
    }

    // Check if user already has a ghostwriter profile
    const existingGhostwriter = await prisma.ghostwriter.findUnique({
      where: { userId: session.user.id },
    });

    if (existingGhostwriter) {
      // Update existing profile
      const updatedGhostwriter = await prisma.ghostwriter.update({
        where: { userId: session.user.id },
        data: { name, image },
      });
      return NextResponse.json(updatedGhostwriter);
    } else {
      // Create new profile
      const newGhostwriter = await prisma.ghostwriter.create({
        data: {
          userId: session.user.id,
          name,
          image,
          token: generateToken(), // Generate unique token
        },
      });
      return NextResponse.json(newGhostwriter);
    }
  } catch (error) {
    loggerServer.error("Error creating/updating ghostwriter profile", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
