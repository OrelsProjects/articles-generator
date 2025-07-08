import { authOptions } from "@/auth/authOptions";
import {
  createSchedule,
  deleteLatestScheduleByNoteId,
  deleteScheduleById,
  getLatestScheduleForNote,
} from "@/lib/dal/scheduledNote";
import {
  isValidScheduleTime,
  MIN_SCHEDULE_MINUTES,
} from "@/lib/utils/date/schedule";
import { Logger } from "@/logger";
import loggerServer from "@/loggerServer";
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
      loggerServer.error(
        "[SCHEDULE-V1] Invalid request body: " + JSON.stringify(body),
      );
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
    loggerServer.info(
      "[SCHEDULE-V1] Request body: " + JSON.stringify(parsedBody.data),
      {
        userId: session.user.id,
      },
    );
    const { noteId, scheduledTo, deleteIfExists } = parsedBody.data;
    const now = new Date();
    // add MIN_SCHEDULE_MINUTES to now
    const isValidTime = isValidScheduleTime(new Date(scheduledTo));
    const scheduledToDate = new Date(scheduledTo);
    loggerServer.info(
      "[SCHEDULE-V1] Scheduled to date: " + scheduledToDate + "Now: " + now,
      {
        userId: session.user.id,
      },
    );
    if (!isValidTime) {
      loggerServer.error(
        "[SCHEDULE-V1] Schedule has to be at least " +
          MIN_SCHEDULE_MINUTES +
          " minutes in the future: " +
          JSON.stringify(parsedBody.data),
        {
          userId: session.user.id,
        },
      );
      return NextResponse.json(
        {
          error: `Schedule has to be at least ${MIN_SCHEDULE_MINUTES} minutes in the future`,
        },
        { status: 400 },
      );
    }
    loggerServer.info(
      "[SCHEDULE-V1] Deleting latest schedule by note id: " + noteId,
      {
        userId: session.user.id,
      },
    );
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
    Logger.error("Error scheduling note", {
      userId: session?.user.id,
      error,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const queryParams = request.nextUrl.searchParams;
    // Can have either scheduleId or noteId
    let scheduleId = queryParams.get("scheduleId");
    const noteId = queryParams.get("noteId");
    if (!scheduleId && !noteId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // If no scheduleId, get the scheduleId from the noteId
    if (!scheduleId) {
      const schedule = await getLatestScheduleForNote(noteId as string);
      if (!schedule) {
        loggerServer.error("[DELETE-SCHEDULE] Schedule not found: " + noteId, {
          userId: session.user.id,
        });
        return NextResponse.json(
          { error: "Schedule not found" },
          { status: 404 },
        );
      }
      scheduleId = schedule.id;
    }
    loggerServer.info(
      "[DELETE-SCHEDULE] Deleting schedule: " +
        scheduleId +
        " noteId: " +
        noteId,
      {
        userId: session.user.id,
      },
    );
    await deleteScheduleById(scheduleId);
    loggerServer.info(
      "[DELETE-SCHEDULE] Successfully deleted schedule: " + scheduleId,
      {
        userId: session.user.id,
      },
    );
    return NextResponse.json({ scheduleId }, { status: 200 });
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
