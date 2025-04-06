import { authOptions } from "@/auth/authOptions";
import { createNote, CreateNote } from "@/lib/dal/note";
import { getAuthorId, getHandleDetails } from "@/lib/dal/publication";
import { NoteDraft } from "@/types/note";
import { NoteStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  try {
    const newNoteDraft: Partial<NoteDraft> | undefined = await request.json();
    const authorId = await getAuthorId(userId);
    let handle = "",
      name = "",
      photoUrl = "";
    if (authorId) {
      const {
        handle: handleFromDb,
        name: nameFromDb,
        photoUrl: photoUrlFromDb,
      } = await getHandleDetails(authorId);
      handle = handleFromDb;
      name = nameFromDb;
      photoUrl = photoUrlFromDb;
    }

    const createNoteBody: CreateNote = {
      userId,
      body: newNoteDraft?.body || "",
      status: newNoteDraft?.status || NoteStatus.draft,
      name: name,
      bodyJson: null,
      summary: "",
      type: null,
      thumbnail: photoUrl,
      topics: [],
      feedback: null,
      feedbackComment: null,
      inspiration: null,
      handle: handle,
      generatingModel: null,
      initialGeneratingModel: null,
      isArchived: false,
      ...newNoteDraft,
      authorId: newNoteDraft?.authorId || authorId || 0,
      scheduledTo: newNoteDraft?.scheduledTo || null,
      sentViaScheduleAt: null,
    };
    const note = await createNote(createNoteBody);

    const noteDraft: NoteDraft = {
      id: note.id,
      body: note.body,
      status: note.status,
      createdAt: note.createdAt,
      authorId: authorId || 0,
      authorName: name,
      handle,
      thumbnail: photoUrl,
      name,
      scheduledTo: newNoteDraft?.scheduledTo || undefined,
      wasSentViaSchedule: false,
    };

    return NextResponse.json(noteDraft);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
