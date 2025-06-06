import { getNoteAttachments, getNoteById } from "@/lib/dal/note";
import { markdownToADF } from "@/lib/utils/adf";
import { Logger } from "@/logger";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: { noteId: string } },
) {
  try {
    const { noteId } = params;
    const note = await getNoteById(noteId);
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