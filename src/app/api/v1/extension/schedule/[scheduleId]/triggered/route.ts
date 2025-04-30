import { prisma } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { getNoteByScheduleId, updateNote } from "@/lib/dal/note";
import { Logger } from "@/logger";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  ok: z.boolean(),
  error: z.string().optional(),
  text: z.string().optional(),
  substackNoteId: z.number().or(z.string()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { scheduleId: string } },
) {
  // const session = await getServerSession(authOptions);
  // if (!session) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  try {
    const { scheduleId } = params;
    const body = await request.json();
    const parsedBody = schema.safeParse(body);
    if (!parsedBody.success) {
      Logger.error(
        `Invalid request body: ${JSON.stringify(parsedBody.error)}, for body: ${JSON.stringify(body)}`,
      );
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { ok, error, text, substackNoteId } = parsedBody.data;

    if (!ok) {
      Logger.error(
        `Failed to trigger schedule: ${scheduleId}, error: ${error}, with text: ${text}`,
      );
      return NextResponse.json({ error: error }, { status: 400 });
    }

    // update schedule status to "published"
    const note = await getNoteByScheduleId(scheduleId);
    if (!note) {
      Logger.error(`Note not found for schedule: ${scheduleId}`);
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    await updateNote(note.id, {
      status: "published",
    });

    if (substackNoteId) {
      await prisma.substackPublishedNote.create({
        data: {
          substackNoteId: substackNoteId.toString(),
          userId: note.userId,
          noteId: note.id,
        },
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    Logger.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
