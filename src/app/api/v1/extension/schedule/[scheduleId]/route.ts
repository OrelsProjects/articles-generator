import { authOptions } from "@/auth/authOptions";
import { getNoteAttachments, getNoteByScheduleId } from "@/lib/dal/note";
import { deleteScheduleById } from "@/lib/dal/schedules";
import { bodyJsonToSubstackBody, markdownToADF } from "@/lib/utils/adf";
import { Logger } from "@/logger";
import { NoteDraftImage } from "@/types/note";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: { scheduleId: string } },
) {
  try {
    const { scheduleId } = params;
    const note = await getNoteByScheduleId(scheduleId);
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    let adf: any | null = null;
    if (note.bodyJson) {
      try {
        const bodyJson = JSON.parse(note.bodyJson);
        adf = bodyJsonToSubstackBody(bodyJson);
      } catch (error) {
        adf = await markdownToADF(note.body);
      }
    } else {
      adf = await markdownToADF(note.body);
    }

    const attachments = await getNoteAttachments(note.id);
    const attachmentsForResponse: NoteDraftImage[] = attachments.map(
      attachment => ({
        id: attachment.id,
        url: attachment.s3Url,
        type: attachment.type,
      }),
    );
    const response: {
      jsonBody: any;
      attachmentUrls: string[];
      attachments: NoteDraftImage[];
    } = {
      jsonBody: adf,
      attachmentUrls: attachments.map(attachment => attachment.s3Url),
      attachments: attachmentsForResponse,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    Logger.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { scheduleId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { scheduleId } = params;
    await deleteScheduleById(scheduleId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    Logger.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
