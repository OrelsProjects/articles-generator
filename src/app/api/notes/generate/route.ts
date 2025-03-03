import prisma, { prismaArticles } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { searchSimilarNotes } from "@/lib/dal/milvus";
import { generateNotesPrompt } from "@/lib/prompts";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { NotesComments } from "@/../prisma/generated/articles";
import { runPrompt } from "@/lib/open-router";
import { parseJson } from "@/lib/utils/json";
import { Note } from "@prisma/client";

export async function GET(req: NextRequest) {
  console.time("generate notes");
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let newNotes: any[] = [];
  try {
    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        publication: true,
      },
    });

    const publicationId = userMetadata?.publication?.idInArticlesDb;

    if (!publicationId) {
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
      ORDER BY RANDOM()
      LIMIT 10;
    `) as NotesComments[];

    const query = `
    Here's a list of notes I've written:
    ${notes.map((note, index) => `(${index + 1}) ${note.body}`).join("\n\n")}`;

    const relatedNotes = await searchSimilarNotes({
      query,
      limit: 10,
      filters: [
        {
          leftSideValue: "reaction_count",
          rightSideValue: "500",
          operator: ">=",
        },
      ],
    });

    const messages = generateNotesPrompt(
      relatedNotes.map((note: NotesComments) => note.body),
      notes.map(note => note.body),
    );

    const response = await runPrompt(messages, "anthropic/claude-3.7-sonnet");
    newNotes = (await parseJson(response)) as {
      body: string;
      bodyJson: any;
      summary: string;
    }[];

    const notesCreated: Note[] = [];

    for (const note of newNotes) {
      const newNote = await prisma.note.create({
        data: {
          body: note.body,
          bodyJson: note.bodyJson,
          summary: note.summary,
          userId: session.user.id,
        },
      });
      notesCreated.push(newNote);
    }

    return NextResponse.json(notesCreated);
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
