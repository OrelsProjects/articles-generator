import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { GhostwriterDAL } from "@/lib/dal/ghostwriter";

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

    const ghostwriter = await GhostwriterDAL.createOrUpdateProfile(
      session.user.id,
      name,
      image,
    );

    return NextResponse.json(ghostwriter);
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
