import { prisma } from "@/app/api/_db/db";
import { getNoteByScheduleId, updateNote } from "@/lib/dal/note";
import { Logger } from "@/logger";
import loggerServer from "@/loggerServer";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  ok: z.boolean().optional(),
  error: z.string().optional(),
  text: z.string().optional(),
  substackNoteId: z.number().or(z.string()).optional(),
  newStatus: z.enum(["draft", "published", "scheduled"]).optional().nullable(),
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
    loggerServer.info("[TRIGGERED] scheduleId: " + params.scheduleId);
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

    loggerServer.info("[TRIGGERED] parsedBody: " + JSON.stringify(parsedBody.data));

    const { ok, error, text, substackNoteId, newStatus } = parsedBody.data;

    if (!ok) {
      Logger.error(
        `Failed to trigger schedule: ${scheduleId}, error: ${error}, with text: ${text}`,
      );
      return NextResponse.json({}, { status: 200 });
    }

    // update schedule status to "published"
    const note = await getNoteByScheduleId(scheduleId);
    if (!note) {
      Logger.error(`Note not found for schedule: ${scheduleId}`);
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    loggerServer.info("[TRIGGERED] note: " + JSON.stringify(note) + " with newStatus: " + newStatus);
    if (newStatus) {
      await updateNote(note.id, {
        status: newStatus,
      });
    } else {
      await updateNote(note.id, {
        status: "published",
      });
    }

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
