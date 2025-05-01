import loggerServer from "@/loggerServer";
import { prisma } from "@/app/api/_db/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { NoteDraft } from "@/types/note";

const schema = z.object({
  scheduleIds: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedBody = schema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: parsedBody.error }, { status: 400 });
    }

    const schedules = await prisma.scheduledNote.findMany({
      where: {
        id: { in: parsedBody.data.scheduleIds },
      },
    });

    const notes = await prisma.note.findMany({
      where: {
        id: { in: schedules.map(schedule => schedule.noteId) },
      },
      include: {
        S3Attachment: true,
      },
    });

    const noteDrafts: (NoteDraft & { scheduleId: string })[] = [];
    for (const note of notes) {
      const scheduledId = schedules.find(
        schedule => schedule.noteId === note.id,
      )?.id;
      if (!scheduledId) {
        loggerServer.error("Scheduled ID not found", { noteId: note.id });
        continue;
      }
      const noteDraft = {
        id: note.id,
        thumbnail: note.thumbnail || undefined,
        body: note.body,
        createdAt: note.createdAt,
        authorId: note.authorId,
        authorName: note.name || "",
        status: note.status,
        feedback: note.feedback || undefined,
        feedbackComment: note.feedbackComment || undefined,
        scheduledTo: note.scheduledTo,
        wasSentViaSchedule: note.sentViaScheduleAt !== null,
        isArchived: note.isArchived,
        attachments: note.S3Attachment.map(attachment => ({
          id: attachment.id,
          url: attachment.s3Url,
        })),
        handle: note.handle || undefined,
        scheduleId: scheduledId,
      };

      noteDrafts.push(noteDraft);
    }

    return NextResponse.json(noteDrafts, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Error fetching schedules", { error: error.message });
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
