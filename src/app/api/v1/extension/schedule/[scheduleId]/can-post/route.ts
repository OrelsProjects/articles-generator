import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_db/db";
import loggerServer from "@/loggerServer";

export async function POST(
  request: NextRequest,
  { params }: { params: { scheduleId: string } },
) {
  const { scheduleId } = params;
  try {
    loggerServer.info("[CAN-POST] scheduleId: " + scheduleId);
    const schedule = await prisma.scheduledNote.findUnique({
      where: {
        id: scheduleId,
      },
    });

    if (!schedule) {
      loggerServer.error("[CAN-POST] Schedule not found: " + scheduleId);
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 },
      );
    }

    loggerServer.info("[CAN-POST] schedule: " + JSON.stringify(schedule));

    // If the schedule is in the past, more than 10 minutes ago, return false
    // if (schedule.scheduledAt <= new Date(Date.now() - 10 * 60 * 1000)) {
    //   return NextResponse.json(
    //     { canPost: false, error: "Schedule was missed" },
    //     { status: 200 },
    //   );
    // }

    return NextResponse.json({ canPost: true }, { status: 200 });
  } catch (error) {
    loggerServer.error("[CAN-POST] Error: " + error);
    return NextResponse.json(
      { canPost: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
