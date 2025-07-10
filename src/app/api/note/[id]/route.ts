import { authOptions } from "@/auth/authOptions";
import {
  archiveNote,
  getNoteById,
  isOwnerOfNote,
  updateNote,
} from "@/lib/dal/note";
import { getEventBridgeSchedule } from "@/lib/utils/event-bridge";
import loggerServer from "@/loggerServer";
import { NoteDraft } from "@/types/note";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = params;
    const note: Partial<NoteDraft> = await req.json();

    if (!note) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const isOwner = await isOwnerOfNote(id, session.user.id);

    if (!isOwner) {
      // TODO: Change before push
      return NextResponse.json(
        {
          error: `Unauthorized: ${isOwner} , ${note.ghostwriter}, ${note} ${session.user.id}`,
        },
        { status: 401 },
      );
      // TODO: Change before push
    }

    // If timestamp is provided, ensure it's a Date object
    if (note.scheduledTo && typeof note.scheduledTo === "string") {
      note.scheduledTo = new Date(note.scheduledTo);
    }

    const currentNote = await getNoteById(id);

    // const existingSchedule = await getEventBridgeSchedule({
    //   id,
    // });

    const isChangingFromScheduled =
      note.status &&
      currentNote?.status === "scheduled" &&
      note.status !== "scheduled";

    // if (isChangingFromScheduled) {
      // If we change from scheduled to not scheduled, the existing schedule has to be null.
      // if (existingSchedule) {
      //   throw new Error("Can't change from scheduled to not scheduled");
      // }
    // }

    await updateNote(id, note);

    return NextResponse.json({}, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Error updating note", {
      error,
      userId: session?.user.id,
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = params;
    const isOwner = await isOwnerOfNote(id, session.user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await archiveNote(id);
    return NextResponse.json({}, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Error deleting note", {
      error,
      userId: session?.user.id,
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
