import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import loggerServer from "@/loggerServer";
import { generateScheduleNoteMissedEmail } from "@/lib/mail/templates";

const MAX_MINUTES_TO_POST = 0;

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

    const twentyMinutesAgo = new Date(
      Date.now() - MAX_MINUTES_TO_POST * 60 * 1000,
    );
    // If the schedule is in the past, more than 20 minutes ago, return false
    if (schedule.scheduledAt <= twentyMinutesAgo) {
      const user = await prisma.user.findUnique({
        where: {
          id: schedule.userId,
        },
      });

      loggerServer.info(
        "[CAN-POST] Schedule was missed: " + schedule.scheduledAt,
        {
          userId: user?.id || "unknown",
          scheduledAt: schedule.scheduledAt,
          twentyMinutesAgo: twentyMinutesAgo,
        },
      );
      const note = await prisma.note.findUnique({
        where: {
          id: schedule.noteId,
        },
      });
      const missedEmail = generateScheduleNoteMissedEmail(
        user?.name || "",
        schedule.id,
        note?.body || "",
        "Note schedule was triggered, but more than 10 minutes have passed since the scheduled time",
      );
      loggerServer.debug("Sending missed email", {
        missedEmail,
        userId: user?.id || "unknown",
        noteId: schedule.noteId,
        noteBody: note?.body || "",
        reason:
          "Note schedule was triggered, but more than 10 minutes have passed since the scheduled time",
      });
      // await sendMailSafe({
      //   to: "orelsmail@gmail.com",
      //   from: "noreply",
      //   subject: missedEmail.subject,
      //   template: missedEmail.body,
      // });
      return NextResponse.json(
        { canPost: false, error: "Schedule was missed" },
        { status: 200 },
      );
    }
    loggerServer.info(
      "[CAN-POST] Schedule is ready to post: " + schedule.scheduledAt,
    );
    return NextResponse.json({ canPost: true }, { status: 200 });
  } catch (error) {
    loggerServer.error("[CAN-POST] Error: " + error);
    return NextResponse.json(
      { canPost: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
