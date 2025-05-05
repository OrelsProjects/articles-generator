import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_db/db";
import loggerServer from "@/loggerServer";
import { generateScheduleNoteMissedEmail } from "@/lib/mail/templates";
import { sendMailSafe } from "@/lib/mail/mail";

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

    const user = await prisma.user.findUnique({
      where: {
        id: schedule.userId,
      },
    });

    loggerServer.info("[CAN-POST] schedule: " + JSON.stringify(schedule));

    // If the schedule is in the past, more than 20 minutes ago, return false
    if (schedule.scheduledAt <= new Date(Date.now() - 20 * 60 * 1000)) {
      const missedEmail = generateScheduleNoteMissedEmail(
        schedule.userId,
        schedule.id,
        schedule.noteId,
        "Note schedule was triggered, but more than 10 minutes have passed since the scheduled time",
      );
      // await sendMailSafe({
      //   to: user?.email || "orelsmail@gmail.com",
      //   from: "noreply",
      //   subject: missedEmail.subject,
      //   template: missedEmail.body,
      //   cc: "orelsmail@gmail.com",
      // });
      return NextResponse.json(
        { canPost: false, error: "Schedule was missed" },
        { status: 200 },
      );
    }

    return NextResponse.json({ canPost: true }, { status: 200 });
  } catch (error) {
    loggerServer.error("[CAN-POST] Error: " + error);
    return NextResponse.json(
      { canPost: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
