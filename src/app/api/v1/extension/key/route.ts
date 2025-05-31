import { authOptions } from "@/auth/authOptions";
import { Logger } from "@/logger";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { getExtensionKey } from "@/lib/dal/extension-key";
import { getAuthorId } from "@/lib/dal/publication";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    Logger.warn("Unauthorized request to generate extension key");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const key = await getExtensionKey(session.user.id);
    const authorId = await getAuthorId(session.user.id);
    return NextResponse.json({ key: key || null, authorId: authorId || null });
  } catch (error) {
    Logger.error("Error getting extension key", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}