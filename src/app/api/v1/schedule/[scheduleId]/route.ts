import { authOptions } from "@/auth/authOptions";
import { getNoteByScheduleId } from "@/lib/dal/note";
import { deleteScheduleById } from "@/lib/dal/schedules";
import { Logger } from "@/logger";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: { scheduleId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { scheduleId } = params;
    const note = await getNoteByScheduleId(scheduleId);
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json({ note }, { status: 200 });
  } catch (error: any) {
    Logger.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { scheduleId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    loggerServer.info("[DELETE-SCHEDULE] Deleting schedule: " + params.scheduleId, {
      userId: session.user.id,
    });
    const { scheduleId } = params;
    await deleteScheduleById(scheduleId);
    loggerServer.info("[DELETE-SCHEDULE] Successfully deleted schedule: " + scheduleId, {
      userId: session.user.id,
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    Logger.error("[DELETE-SCHEDULE] Error deleting schedule: " + error, {
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
