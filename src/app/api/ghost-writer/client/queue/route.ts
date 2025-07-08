import { authOptions } from "@/auth/authOptions";
import { GhostwriterDAL } from "@/lib/dal/ghostwriter";
import { getUserSchedules } from "@/lib/dal/queue";
import loggerServer from "@/loggerServer";
import { UserSchedule } from "@/types/schedule";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clientId = request.nextUrl.searchParams.get("clientId");
    let userSchedules: UserSchedule[] = [];

    if (!clientId) {
      loggerServer.error("Missing clientId in ghostwriter client queue", {
        userId: session.user.id,
      });
      return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
    }
    const canRun = await GhostwriterDAL.canRunOnBehalfOf({
      ghostwriterUserId: session.user.id,
      clientId,
    });

    if (!canRun) {
      loggerServer.error("Unauthorized ghostwriter access", {
        userId: session.user.id,
        clientId,
      });
      return NextResponse.json(
        { error: "Unauthorized ghostwriter access" },
        { status: 403 },
      );
    }

    userSchedules = await getUserSchedules(clientId);
    return NextResponse.json(userSchedules);
  } catch (error: any) {
    loggerServer.error("Error getting user schedules", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
