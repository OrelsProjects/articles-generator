import prisma from "@/app/api/_db/db";
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
      body: "",
      authorId,
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
      ...newNoteDraft,
    };
    const note = await createNote(createNoteBody);

    const noteDraft: NoteDraft = {
      id: note.id,
      body: note.body,
      status: note.status,
      timestamp: note.createdAt,
      authorId: authorId || null,
      authorName: name,
      handle,
      thumbnail: photoUrl,
      name,
    };

    return NextResponse.json(noteDraft);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
