import loggerServer from "@/loggerServer";
import { NextRequest, NextResponse } from "next/server";
import { decodeKey } from "@/lib/dal/extension-key";
import { getActiveSchedulesByUserId } from "@/lib/dal/scheduledNote";

export async function GET(request: NextRequest) {
  let userId: string | undefined;
  try {
    const key = request.headers.get("x-extension-key");
    if (!key) {
      loggerServer.warn("[EXTENSION-DATA] Unauthorized, no extension key", {
        userId: "not logged in",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = decodeKey(key);
    userId = decoded.userId;
    if (!userId) {
      loggerServer.warn("[EXTENSION-DATA] Unauthorized, no userId in key", {
        userId: "not logged in",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeSchedules = await getActiveSchedulesByUserId(userId);

    return NextResponse.json({ activeSchedules }, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Error fetching schedules", {
      error: error.message,
      userId: "extension",
    });
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
