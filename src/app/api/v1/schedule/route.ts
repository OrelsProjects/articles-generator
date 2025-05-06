import { authOptions } from "@/auth/authOptions";
import {
  createSchedule,
  deleteLatestScheduleByNoteId,
} from "@/lib/dal/schedules";
import { MIN_SCHEDULE_MINUTES } from "@/lib/utils/date/schedule";
import { Logger } from "@/logger";
import loggerServer from "@/loggerServer";
import { isAfter, isBefore } from "date-fns";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  noteId: z.string(),
  scheduledTo: z.date().or(z.string()),
  deleteIfExists: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsedBody = schema.safeParse(body);
    if (!parsedBody.success) {
      loggerServer.error("[SCHEDULE-V1] Invalid request body: " + JSON.stringify(body));
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
    loggerServer.info("[SCHEDULE-V1] Request body: " + JSON.stringify(parsedBody.data));
    const { noteId, scheduledTo, deleteIfExists } = parsedBody.data;
    const now = new Date();
    // add MIN_SCHEDULE_MINUTES to now
    const minScheduledTo = new Date(
      now.getTime() + MIN_SCHEDULE_MINUTES * 60000,
    );
    const scheduledToDate = new Date(scheduledTo);
    loggerServer.info("[SCHEDULE-V1] Scheduled to date: " + scheduledToDate + "Now: " + now);
    if (isBefore(scheduledToDate, minScheduledTo)) {
      loggerServer.error("[SCHEDULE-V1] Schedule has to be at least " + MIN_SCHEDULE_MINUTES + " minutes in the future: " + JSON.stringify(parsedBody.data));
      return NextResponse.json(
        {
          error: `Schedule has to be at least ${MIN_SCHEDULE_MINUTES} minutes in the future`,
        },
        { status: 400 },
      );
    }
    loggerServer.info("[SCHEDULE-V1] Deleting latest schedule by note id: " + noteId);
    if (deleteIfExists) {
      await deleteLatestScheduleByNoteId(noteId);
    }
    const newSchedule = await createSchedule({
      userId: session.user.id,
      noteId,
      scheduledAt: new Date(scheduledTo),
      scheduleId: noteId,
    });
    return NextResponse.json(
      {
        schedule: newSchedule,
        deleted: deleteIfExists,
      },
      { status: 200 },
    );
  } catch (error: any) {
    Logger.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
