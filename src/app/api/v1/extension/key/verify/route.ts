import { authOptions } from "@/auth/authOptions";
import { Logger } from "@/logger";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { decodeKey, setKeyVerified } from "@/lib/dal/extension-key";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    Logger.warn("Unauthorized request to generate extension key");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { key } = await request.json();
    if (!key) {
      Logger.warn("No key provided in verify extension key");
      return NextResponse.json({ error: "No key provided" }, { status: 400 });
    }
    const decoded = decodeKey(key);
    const authorIdDecoded = decoded.authorId;
    if (decoded.userId !== session.user.id) {
      Logger.warn("Key does not belong to user in verify extension key");
      return NextResponse.json(
        { error: "Key does not belong to user" },
        { status: 400 },
      );
    }

    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        publication: true,
      },
    });

    if (!userMetadata?.publication) {
      Logger.warn("User does not have a publication in verify extension key");
      return NextResponse.json(
        { error: "User does not have a publication" },
        { status: 400 },
      );
    }

    const authorId = userMetadata.publication.authorId;
    if (authorId !== authorIdDecoded) {
      Logger.warn("Key does not belong to user in verify extension key");
      return NextResponse.json(
        { error: "Key does not belong to user" },
        { status: 400 },
      );
    }

    await setKeyVerified(key);
    return NextResponse.json({ success: true });
  } catch (error) {
    Logger.error("Error generating extension key", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
