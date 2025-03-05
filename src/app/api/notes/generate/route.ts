import prisma, { prismaArticles } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { Filter, searchSimilarNotes } from "@/lib/dal/milvus";
import { generateNotesPrompt } from "@/lib/prompts";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { NotesComments } from "@/../prisma/generated/articles";
import { runPrompt } from "@/lib/open-router";
import { parseJson } from "@/lib/utils/json";
import { Note } from "@prisma/client";
import { NoteDraft, Note as NoteType } from "@/types/note";

export async function POST(req: NextRequest) {
  console.time("generate notes");
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let newNotes: any[] = [];
  const body = await req.json();
  const countString = body.count;
  const count = Math.min(parseInt(countString || "1"), 3);
  try {
    const userNotes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        summary: true,
      },
    });

    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        publication: true,
      },
    });

    const publicationId = userMetadata?.publication?.idInArticlesDb;

    if (!publicationId || !userMetadata.publication) {
      return NextResponse.json(
        { error: "Publication not found" },
        { status: 404 },
      );
    }

    const publication = await prismaArticles.publication.findFirst({
      where: {
        id: parseInt(publicationId.toString()),
      },
      select: {
        authorId: true,
      },
    });

    if (!publication || !publication.authorId) {
      return NextResponse.json(
        { error: "Publication not found" },
        { status: 404 },
      );
    }

    const authorId = publication.authorId;

    const notes = (await prismaArticles.$queryRaw`
      SELECT * FROM "notes_comments"
      WHERE "user_id" = ${parseInt(authorId.toString())}
      ORDER BY "reaction_count" DESC
      LIMIT 5;
    `) as NotesComments[];

    // const query = `
    // Here's a list of notes I've written:
    // ${notes.map((note, index) => `(${index + 1}) ${note.body}`).join("\n\n")}`;

    const query = `${userMetadata.publication.generatedDescription}.`;

    const randomMinReaction = Math.floor(Math.random() * 300);
    const randomMaxReaction =
      randomMinReaction + Math.floor(Math.random() * 60000);
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
    ];

    const inspirations = await searchSimilarNotes({
      query,
      limit: 20,
      filters,
    });

    const uniqueInspirations = inspirations.filter(
      (note, index, self) =>
        index === self.findIndex((t) => t.body === note.body),
    ).slice(0, 10);

    const messages = generateNotesPrompt(
      userMetadata.publication,
      uniqueInspirations.map((note: NotesComments) => note.body),
      notes.map(note => note.body),
      userNotes.map(note => note.summary),
      count,
    );

    const response = await runPrompt(messages, "anthropic/claude-3.7-sonnet");
    newNotes = (await parseJson(response)) as {
      body: string;
      bodyJson: any;
      summary: string;
      type: string;
    }[];

    const notesCreated: Note[] = [];
    // TODO: ADD TOPICS AND COUNT OF EACH SO THE CHAT GENERATES FRESH CONTENT AND NOT ONLY LSITS
    for (const note of newNotes) {
      const newNote = await prisma.note.create({
        data: {
          body: note.body,
          bodyJson: note.bodyJson,
          summary: note.summary,
          userId: session.user.id,
          type: note.type,
          authorId: parseInt(authorId.toString()),
        },
      });
      notesCreated.push(newNote);
    }

    const notesResponse: NoteDraft[] = notesCreated.map((note: Note) => ({
      id: note.id,
      content: note.body,
      jsonBody: note.bodyJson as any[],
      timestamp: note.createdAt,
      authorId: parseInt(authorId.toString()),
      authorName: note.handle || "",
      reactionCount: 0,
      reactions: [],
      restacks: 0,
    }));

    return NextResponse.json(notesResponse);
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