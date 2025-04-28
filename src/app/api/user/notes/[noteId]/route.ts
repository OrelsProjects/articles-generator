import { prisma } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { isOwnerOfNote } from "@/lib/dal/note";
import loggerServer from "@/loggerServer";
import { NoteDraft } from "@/types/note";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: { noteId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { noteId } = params;

    const isOwner = await isOwnerOfNote(noteId, session.user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const note = await prisma.note.findUnique({
      where: {
        id: noteId,
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const noteDraft: NoteDraft = {
      id: note.id,
      body: note.body,
      status: note.status,
      createdAt: note.createdAt,
      authorId: note.authorId || 0,
      authorName: note.name || "",
      handle: note.handle || "",
      thumbnail: note.thumbnail || "",
      name: note.name || "",
      scheduledTo: note.scheduledTo,
      wasSentViaSchedule: !!note.sentViaScheduleAt,
    };

    return NextResponse.json(noteDraft);
  } catch (error: any) {
    loggerServer.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
