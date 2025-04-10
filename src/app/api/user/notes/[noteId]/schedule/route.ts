import { authOptions } from "@/auth/authOptions";
import { isOwnerOfNote } from "@/lib/dal/note";
import {
  createScheduleForNote,
  deleteScheduleForNote,
} from "@/lib/dal/note-schedule";
import loggerServer from "@/loggerServer";
import { NoteStatus } from "@prisma/client";
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
