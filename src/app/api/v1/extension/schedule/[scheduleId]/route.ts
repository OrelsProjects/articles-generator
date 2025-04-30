import { authOptions } from "@/auth/authOptions";
import { getNoteAttachments, getNoteByScheduleId } from "@/lib/dal/note";
import { deleteScheduleById } from "@/lib/dal/schedules";
import { markdownToADF } from "@/lib/utils/adf";
import { Logger } from "@/logger";
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

    const adf = await markdownToADF(note.body);
    const attachments = await getNoteAttachments(note.id);
    const response: {
      jsonBody: any;
      attachmentUrls: string[];
    } = {
      jsonBody: adf,
      attachmentUrls: attachments.map(attachment => attachment.s3Url),
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
