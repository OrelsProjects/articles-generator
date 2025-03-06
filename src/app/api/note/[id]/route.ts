import { authOptions } from "@/auth/authOptions";
import { archiveNote, isOwnerOfNote, updateNote } from "@/lib/dal/note";
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
    const note: NoteDraft = await req.json();
    const isOwner = await isOwnerOfNote(id, session.user.id);

    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await updateNote(note);

    return NextResponse.json({}, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Error updating note", error);
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
    loggerServer.error("Error deleting note", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
