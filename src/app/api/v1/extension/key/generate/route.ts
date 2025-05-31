import { authOptions } from "@/auth/authOptions";
import { Logger } from "@/logger";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { generateExtensionKey } from "@/lib/dal/extension-key";
import { getAuthorId } from "@/lib/dal/publication";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    Logger.warn("Unauthorized request to generate extension key");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const authorId = await getAuthorId(session.user.id);
    if (!authorId) {
      Logger.error("Author not found in generate extension key");
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }
    const key = await generateExtensionKey(session.user.id, authorId);
    return NextResponse.json({ key, authorId });
  } catch (error) {
    Logger.error("Error generating extension key", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
