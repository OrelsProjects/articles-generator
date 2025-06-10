import { decodeKey } from "@/lib/dal/extension-key";
import { prisma } from "@/lib/prisma";
import loggerServer from "@/loggerServer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let userId: string | null = null;
  try {
    const key = request.headers.get("x-extension-key");
    if (!key) {
      loggerServer.warn(
        "[EXTENSION-DATA] Unauthorized, no extension key",
        {
          userId: "not logged in",
        },
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = decodeKey(key);
    userId = decoded.userId;
    if (!userId) {
      loggerServer.warn(
        "[EXTENSION-DATA] Unauthorized, no userId in key",
        {
          userId: "not logged in",
        },
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { version } = await request.json();

    await prisma.extensionDetails.upsert({
      where: {
        userId,
      },
      update: {
        versionInstalled: version,
      },
      create: {
        userId,
        versionInstalled: version,
      },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    loggerServer.error("[EXTENSION-DATA] Error", {
      userId: userId || "not logged in",
      error,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}