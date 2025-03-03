import prisma, { prismaArticles } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { Filter, searchSimilarNotes } from "@/lib/dal/milvus";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { NotesComments } from "../../../../../prisma/generated/articles";

const filterNotes = (notes: NotesComments[]) => {
  const uniqueInspirations = notes.filter(
    (note, index, self) => index === self.findIndex(t => t.body === note.body),
  );
  const orderedByReaction = uniqueInspirations.sort(
    (a, b) => b.reactionCount - a.reactionCount,
  );
  const uniqueAuthors = orderedByReaction.filter(
    (note, index, self) =>
      index === self.findIndex(t => t.authorId === note.authorId),
  );
  const notesNoLookingFor = uniqueAuthors.filter(
    note =>
      !note.body.toLowerCase().includes("looking for") &&
      !note.body.toLowerCase().includes("connect with") &&
      !note.body.toLowerCase().includes("to connect"),
  );

  return notesNoLookingFor.slice(0, 12);
};

export async function POST(req: NextRequest) {
  console.time("generate notes");
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { existingNotesIds } = body;
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

    const query = `You are interested in ${publication.topics}.\nProvide **only** generic data, not specific advice.`;
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
      // {
      //   leftSideValue: "comment_count",
      //   rightSideValue: randomMaxComment.toString(),
      //   operator: "<=",
      // },
    ];

    const inspirationNotes = await searchSimilarNotes({
      query,
      limit: 36,
      filters,
    });

    const filteredNotes = filterNotes(inspirationNotes);

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

    return NextResponse.json(filteredNotesWithAttachments);
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
