import { authOptions } from "@/auth/authOptions";
import { Logger } from "@/logger";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { decodeKey, setKeyVerified } from "@/lib/dal/extension-key";

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
    if (decoded.userId !== session.user.id) {
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
