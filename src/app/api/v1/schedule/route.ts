import { authOptions } from "@/auth/authOptions";
import {
  createSchedule,
  deleteLatestScheduleByNoteId,
} from "@/lib/dal/schedules";
import { MIN_SCHEDULE_MINUTES } from "@/lib/utils/date/schedule";
import { Logger } from "@/logger";
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
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
    const { noteId, scheduledTo, deleteIfExists } = parsedBody.data;
    const now = new Date();
    // add MIN_SCHEDULE_MINUTES to now
    const minScheduledTo = new Date(
      now.getTime() + MIN_SCHEDULE_MINUTES * 60000,
    );
    const scheduledToDate = new Date(scheduledTo);
    if (isBefore(scheduledToDate, minScheduledTo)) {
      return NextResponse.json(
        {
          error: `Schedule has to be at least ${MIN_SCHEDULE_MINUTES} minutes in the future`,
        },
        { status: 400 },
      );
    }
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
