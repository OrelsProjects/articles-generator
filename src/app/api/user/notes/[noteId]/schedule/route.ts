import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import {
  getNoteById,
  getScheduledNotesNotSent,
  isOwnerOfNote,
} from "@/lib/dal/note";
import { maxNotesShceduledPerPlan } from "@/lib/plans-consts";
import {
  createScheduleForNote,
  deleteScheduleForNote,
} from "@/lib/dal/note-schedule";
import loggerServer from "@/loggerServer";
import { NoteStatus, Plan } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  date: z.date().or(z.string()),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { noteId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { noteId } = params;
  try {
    const body = await request.json();
    const { date } = schema.parse(body);

    const isOwner = await isOwnerOfNote(noteId, session.user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const note = await getNoteById(noteId);
    if (!note || note.body.length === 0) {
      return NextResponse.json(
        { error: "Note body is empty" },
        { status: 400 },
      );
    }

    const scheduledNotes = await getScheduledNotesNotSent(session.user.id);
    if (
      session.user.meta?.plan &&
      scheduledNotes.length >=
        maxNotesShceduledPerPlan[session.user.meta.plan as Plan]
    ) {
      return NextResponse.json(
        { error: "You have reached the maximum number of scheduled notes" },
        { status: 429 },
      );
    }

    await createScheduleForNote(session.user.id, noteId, new Date(date));
    return NextResponse.json({ message: "Schedule created" }, { status: 200 });
  } catch (error: any) {
    loggerServer.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { noteId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { noteId } = params;
  try {
    const newStatus = request.nextUrl.searchParams.get("status");

    const isOwner = await isOwnerOfNote(noteId, session.user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteScheduleForNote(noteId, newStatus as NoteStatus | "archived");

    return NextResponse.json({ message: "Schedule deleted" }, { status: 200 });
  } catch (error: any) {
    loggerServer.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
