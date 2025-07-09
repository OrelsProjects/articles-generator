import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/auth/authOptions";
import { GhostwriterDAL } from "@/lib/dal/ghostwriter";
import loggerServer from "@/loggerServer";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const ghostwriter = await GhostwriterDAL.getProfile(session.user.id);

    if (!ghostwriter) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(ghostwriter);
  } catch (error) {
    loggerServer.error("Error fetching ghostwriter profile", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 