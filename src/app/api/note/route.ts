import { authOptions } from "@/auth/authOptions";
import { createNote, CreateNote } from "@/lib/dal/note";
import { getAuthorId, getHandleDetails } from "@/lib/dal/publication";
import { NoteDraft } from "@/types/note";
import { NoteStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  body: z.string().optional(),
  status: z.string().optional(),
  bodyJson: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  let userId = session.user.id;
  try {
    const requestBody = await request.json();
    const parsedBody = schema.safeParse(requestBody);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
    const { body, status, bodyJson } = parsedBody.data;

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

    const ghostwriterUserId = null;

    const createNoteBody: CreateNote = {
      userId,
      body: body || "",
      status: status ? (status as NoteStatus) : "draft",
      name: name,
      bodyJson: bodyJson || null,
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
      authorId: authorId || 0,
      scheduledTo: null,
      sentViaScheduleAt: null,
      sendFailedAt: null,
      substackNoteId: null,
      ghostwriterUserId,
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
      scheduledTo: null,
      wasSentViaSchedule: false,
      ghostwriter: null,
    };

    return NextResponse.json(noteDraft);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
