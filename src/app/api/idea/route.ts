import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userMetadata = await prisma.userMetadata.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!userMetadata) {
    loggerServer.error("User  was not initialized");
    return NextResponse.json(
      { error: "User was not initialized" },
      { status: 403 },
    );
  }

  const publicationId = userMetadata.publicationId;

  try {
    // Create new draft idea
    const idea = await prisma.idea.create({
      data: {
        userId: session.user.id,
        publicationId,
        topic: "",
        title: "",
        subtitle: "",
        description: "",
        outline: "",
        inspiration: "",
        body: "",
        status: "new",
        modelUsedForIdeas: "",
        modelUsedForOutline: "",
      },
    });

    return NextResponse.json(idea);
  } catch (error: any) {
    loggerServer.error("Error creating idea:", error.message);
    return NextResponse.json({ error: "Error creating idea" }, { status: 500 });
  }
}
