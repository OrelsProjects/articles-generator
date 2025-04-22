import { authOptions } from "@/auth/authOptions";
import {
  createSchedule,
  deleteLatestScheduleByNoteId,
} from "@/lib/dal/schedules";
import { Logger } from "@/logger";
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
