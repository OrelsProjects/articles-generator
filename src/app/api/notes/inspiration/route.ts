import prisma, { prismaArticles } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { Filter, searchSimilarNotes } from "@/lib/dal/milvus";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { NotesComments } from "@/../prisma/generated/articles";
import { Note } from "@/types/note";

const filterNotes = (
  notes: NotesComments[],
  existingNotes: NotesComments[],
  limit: number,
) => {
  const existingNotesBodys = existingNotes.map(note => note.body.slice(0, 100));
  let newNotes = [...notes];
  newNotes = newNotes.filter(
    (note, index, self) =>
      index === self.findIndex(t => t.commentId === note.commentId),
  );
  newNotes = newNotes.sort((a, b) => b.reactionCount - a.reactionCount);
  newNotes = newNotes.filter(
    note => !existingNotesBodys.includes(note.body.slice(0, 100)),
  );

  newNotes = newNotes.filter(
    note =>
      !note.body.toLowerCase().includes("looking for") &&
      !note.body.toLowerCase().includes("connect with") &&
      !note.body.toLowerCase().includes("to connect"),
  );

  return newNotes.slice(0, limit + 1); // Take one extra to know if there are more
};

export async function POST(req: NextRequest) {
  console.time("generate notes");
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = 10; // Number of items per page

  try {
    const body = await req.json();
    const { existingNotesIds, cursor } = body;
    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        publication: true,
      },
    });

    const publication = userMetadata?.publication;

    if (!publication) {
      return NextResponse.json(
        { error: "Publication not found" },
        { status: 404 },
      );
    }

    const query = `
    ${publication.personalDescription ? `\n${publication.personalDescription}` : ""}.
     ${publication.generatedAboutGeneral}.
     `;
    console.log("query", query);
    const randomMinReaction = Math.floor(Math.random() * 200);
    const randomMaxReaction =
      randomMinReaction + Math.floor(Math.random() * 10000);
    const randomMaxComment = Math.floor(Math.random() * 30);

    console.log("randomMinReaction", randomMinReaction);
    console.log("randomMaxReaction", randomMaxReaction);
    console.log("randomMaxComment", randomMaxComment);

    const filters: Filter[] = [
      {
        leftSideValue: "reaction_count",
        rightSideValue: randomMinReaction.toString(),
        operator: ">=",
      },
      {
        leftSideValue: "reaction_count",
        rightSideValue: randomMaxReaction.toString(),
        operator: "<=",
      },
      {
        leftSideValue: "id",
        rightSideValue: `["${existingNotesIds.join('","')}"]`,
        operator: "not in",
      },
    ];

    const inspirationNotes = await searchSimilarNotes({
      query,
      limit: 40 + existingNotesIds.length,
      filters,
    });

    const existingNotes = await prismaArticles.notesComments.findMany({
      where: {
        commentId: {
          in: existingNotesIds,
        },
      },
      distinct: ["commentId"],
    });

    const filteredNotes = filterNotes(
      inspirationNotes,
      existingNotes,
      existingNotes.length + limit,
    );
    let nextCursor: string | undefined = undefined;

    const hasMore = filteredNotes.length > 0;

    if (filteredNotes.length > limit) {
      const nextItem = filteredNotes.pop(); // Remove the extra item
      nextCursor = nextItem?.commentId;
    }

    const attachments = await prismaArticles.notesAttachments.findMany({
      where: {
        noteId: {
          in: filteredNotes.map(note => parseInt(note.commentId)),
        },
      },
    });

    const filteredNotesWithAttachments = filteredNotes.map(note => {
      const attachment = attachments.find(
        attachment => attachment.noteId === parseInt(note.commentId),
      );
      return { ...note, attachment: attachment?.imageUrl };
    });

    const notesResponse: Note[] = filteredNotesWithAttachments.map(note => ({
      id: note.commentId,
      content: note.body,
      jsonBody: note.bodyJson as any[],
      timestamp: note.date,
      authorId: note.authorId,
      authorName: note.name,
      body: note.body,
      handle: note.handle,
      thumbnail: note.photoUrl,
      reactionCount: note.reactionCount,
      entityKey: note.entityKey,
      commentsCount: note.commentsCount || 0,
      restacks: note.noteIsRestacked ? 1 : 0,
      attachment: note.attachment || undefined,
    }));

    return NextResponse.json({
      items: notesResponse,
      nextCursor,
      hasMore,
    });
  } catch (error: any) {
    loggerServer.error("Failed to fetch notes", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 },
    );
  } finally {
    console.timeEnd("generate notes");
  }
}
