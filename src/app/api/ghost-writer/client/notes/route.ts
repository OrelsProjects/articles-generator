import { authOptions } from "@/auth/authOptions";
import { GhostwriterDAL } from "@/lib/dal/ghostwriter";
import { NoteDraft } from "@/types/note";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const params = request.nextUrl.searchParams;
    const clientId = params.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 },
      );
    }
    const ghostwriter = await GhostwriterDAL.getProfile(session.user.id);

    if (!ghostwriter) {
      return NextResponse.json(
        { error: "Ghostwriter not found" },
        { status: 400 },
      );
    }

    const response = await GhostwriterDAL.getClientNotes(
      ghostwriter.userId,
      clientId,
    );

    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: response.statusCode },
      );
    }

    const noteDrafts: NoteDraft[] =
      response.notes?.map(note => ({
        id: note.id,
        thumbnail: note.thumbnail || session.user.image || undefined,
        body: note.body,
        bodyJson: note.bodyJson ? JSON.parse(note.bodyJson) : undefined,
        createdAt: note.createdAt,
        authorId: note.authorId,
        authorName: note.name || session.user.name || "",
        status: note.status,
        feedback: note.feedback || undefined,
        name: note.name || undefined,
        handle: note.handle || undefined,
        scheduledTo: note.scheduledTo,
        wasSentViaSchedule: !!note.sentViaScheduleAt,
        ghostwriter: note.ghostwriter,
        attachments: note.S3Attachment.map(attachment => ({
          id: attachment.id,
          url: attachment.s3Url,
          type: attachment.type,
        })),
      })) || [];

    return NextResponse.json(noteDrafts);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
