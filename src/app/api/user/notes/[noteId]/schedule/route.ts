import { authOptions } from "@/auth/authOptions";
import {
  getMaxScheduledNotes,
  getNoteById,
  getScheduledNotesNotSent,
  isOwnerOfNote,
} from "@/lib/dal/note";
import {
  createScheduleForNote,
  deleteScheduleForNote,
} from "@/lib/dal/note-schedule";
import loggerServer from "@/loggerServer";
import { NoteStatus, Plan } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLatestScheduleForNote } from "@/lib/dal/scheduledNote";

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

    if (!session.user.meta?.plan) {
      return NextResponse.json(
        { error: "You are not a paid user" },
        { status: 402 },
      );
    }

    const maxScheduledNotes = await getMaxScheduledNotes(
      session.user.id,
      session.user.meta.plan as Plan,
    );

    if (scheduledNotes.length >= maxScheduledNotes) {
      return NextResponse.json(
        { error: "You have reached the maximum number of scheduled notes" },
        { status: 429 },
      );
    }

    await createScheduleForNote(session.user.id, noteId, new Date(date));
    return NextResponse.json({ message: "Schedule created" }, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Error scheduling note", {
      error,
      userId: session?.user.id,
      noteId,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    // 68276228ad569a4d9a6a4ffd
    // 6827710fe2a6de3e07c536fd
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

    const scheduleId = await deleteScheduleForNote(
      noteId,
      newStatus as NoteStatus | "archived",
    );

    return NextResponse.json({ id: scheduleId }, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Error deleting schedule", {
      error,
      userId: session?.user.id,
      noteId,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { noteId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { noteId } = params;
  try {
    const isOwner = await isOwnerOfNote(noteId, session.user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schedule = await getLatestScheduleForNote(noteId);
    return NextResponse.json(schedule, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Error getting schedule", {
      error,
      userId: session?.user.id,
      noteId,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
