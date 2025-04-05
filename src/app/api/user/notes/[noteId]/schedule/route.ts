import { authOptions } from "@/auth/authOptions";
import { isOwnerOfNote } from "@/lib/dal/note";
import { createScheduleForNote } from "@/lib/dal/note-schedule";
import loggerServer from "@/loggerServer";
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
  } catch (error: any) {
    loggerServer.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
