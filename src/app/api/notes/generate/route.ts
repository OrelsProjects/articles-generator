import prisma, { prismaArticles } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { Filter, searchSimilarNotes } from "@/lib/dal/milvus";
import {
  generateNotesPrompt,
  generateImproveNoteTextPrompt,
} from "@/lib/prompts";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { NotesComments } from "@/../prisma/generated/articles";
import { runPrompt } from "@/lib/open-router";
import { parseJson } from "@/lib/utils/json";
import { Note, NoteStatus } from "@prisma/client";
import { NoteDraft } from "@/types/note";
import { canUseAI, useCredits } from "@/lib/utils/credits";
import { AIUsageResponse } from "@/types/aiUsageResponse";

export async function POST(
  req: NextRequest,
): Promise<NextResponse<AIUsageResponse<NoteDraft[]>>> {
  console.time("generate notes");
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  let newNotes: {
    body: string;
    topics: string[];
    summary: string;
    inspiration: string;
    type: string;
  }[] = [];
  const body = await req.json();
  const countString = body.count;
  const count = Math.min(parseInt(countString || "3"), 3);
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

    if (!publicationId || !userMetadata.publication) {
      loggerServer.error("Publication not found", {
        userId: session.user.id,
        publicationId,
        userMetadata,
      });
      return NextResponse.json(
        { success: false, error: "Publication not found" },
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
      loggerServer.error("Publication not found", {
        userId: session.user.id,
        publication,
      });
      return NextResponse.json(
        { success: false, error: "Publication not found" },
        { status: 404 },
      );
    }

    const isValid = await canUseAI(session.user.id, "notesGeneration");
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Not enough credits" },
        { status: 400 },
      );
    }

    const userNotes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
      },
      take: 15,
      orderBy: {
        updatedAt: "desc",
      },
    });

    const notesUserDisliked = await prisma.note.findMany({
      where: {
        userId: session.user.id,
        feedback: "dislike",
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 15,
    });

    const notesUserLiked = await prisma.note.findMany({
      where: {
        userId: session.user.id,
        feedback: "like",
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 15,
    });

    const authorId = publication.authorId;

    const notesFromAuthor = await prismaArticles.notesComments.findMany({
      where: {
        authorId: parseInt(authorId.toString()),
      },
      orderBy: {
        reactionCount: "desc",
      },
      select: {
        handle: true,
        name: true,
        photoUrl: true,
        body: true,
      },
      take: 20,
    });

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

    const uniqueInspirations = inspirations
      .filter(
        (note, index, self) =>
          index === self.findIndex(t => t.body === note.body),
      )
      .slice(0, 10);

    const messages = generateNotesPrompt(
      userMetadata.publication,
      uniqueInspirations.map((note: NotesComments) => note.body),
      notesFromAuthor.map(note => note.body),
      userNotes,
      notesUserDisliked,
      notesUserLiked,
      count,
    );

    const promptResponse = await runPrompt(
      messages,
      "anthropic/claude-3.5-sonnet",
    );
    newNotes = await parseJson(promptResponse);

    const handle = notesFromAuthor[0]?.handle;
    const name = notesFromAuthor[0]?.name;
    const thumbnail = notesFromAuthor[0]?.photoUrl || session.user.image;

    const notesCreated: Note[] = [];
    for (const note of newNotes) {
      const newNote = await prisma.note.create({
        data: {
          body: note.body,
          summary: note.summary,
          topics: note.topics,
          userId: session.user.id,
          status: NoteStatus.draft,
          handle,
          thumbnail,
          type: note.type,
          authorId: parseInt(authorId.toString()),
          name,
          inspiration: note.inspiration,
        },
      });
      notesCreated.push(newNote);
    }

    const notesResponse: NoteDraft[] = notesCreated.map((note: Note) => ({
      id: note.id,
      body: note.body,
      jsonBody: note.bodyJson as any[],
      timestamp: note.createdAt,
      authorId: parseInt(authorId.toString()),
      authorName: note.name || "",
      handle: note.handle || "",
      status: note.status,
      thumbnail: note.thumbnail || undefined,
    }));

    const { creditsUsed, creditsRemaining } = await useCredits(
      session.user.id,
      "notesGeneration",
    );
    const response: AIUsageResponse<NoteDraft[]> = {
      responseBody: {
        body: notesResponse,
        creditsUsed,
        creditsRemaining,
        type: "notesGeneration",
      },
    };
    return NextResponse.json(response);
  } catch (error: any) {
    loggerServer.error("Failed to fetch notes", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notes" },
      { status: 500 },
    );
  } finally {
    console.timeEnd("generate notes");
  }
}
