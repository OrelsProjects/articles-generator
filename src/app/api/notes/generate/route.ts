import { prisma, prismaArticles } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import { Filter, searchSimilarNotes } from "@/lib/dal/milvus";
import {
  generateNotesPrompt,
  generateNotesWritingStylePrompt,
} from "@/lib/prompts";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { NotesComments, Post } from "@/../prisma/generated/articles";
import { Model, runPrompt } from "@/lib/open-router";
import { parseJson } from "@/lib/utils/json";
import { FeatureFlag, Note, NoteStatus } from "@prisma/client";
import { NoteDraft } from "@/types/note";
import { canUseAI, undoUseCredits, useCredits } from "@/lib/utils/credits";
import { AIUsageResponse } from "@/types/aiUsageResponse";
import { getByline } from "@/lib/dal/byline";
import { noteTemplates } from "@/app/api/notes/generate/_consts";
import { Model429Error } from "@/types/errors/Model429Error";
import { z } from "zod";
import { getPublicationByIds } from "@/lib/dal/publication";

const generateNotesSchema = z.object({
  count: z.number().or(z.string()).optional(),
  model: z.string().optional(),
  useTopTypes: z.boolean().optional(),
  topic: z.string().optional(),
  preSelectedPostIds: z.array(z.string()).optional(),
});

export const maxDuration = 300; // This function can run for a maximum of 5 minutes

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

  const body = await req.json();

  const parsedBody = generateNotesSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const userMetadata = await prisma.userMetadata.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      notesToGenerateCount: true,
    },
  });

  if (!userMetadata) {
    return NextResponse.json(
      { success: false, error: "User metadata not found" },
      { status: 404 },
    );
  }

  const countString =
    parsedBody.data.count?.toString() ||
    userMetadata.notesToGenerateCount.toString();
  const requestedModel = parsedBody.data.model;
  const useTopTypes = !!parsedBody.data.useTopTypes;
  const topic = parsedBody.data.topic;
  const preSelectedPostIds = parsedBody.data.preSelectedPostIds;
  const featureFlags = session.user.meta?.featureFlags || [];
  const notesToGenerate = userMetadata.notesToGenerateCount || 3;
  let initialGeneratingModel: Model = "openrouter/auto";
  let model: Model = "openrouter/auto";

  if (requestedModel && featureFlags.includes(FeatureFlag.advancedGPT)) {
    switch (requestedModel) {
      case "gpt-4.5":
        model = "openai/gpt-4.5-preview";
        break;
      case "claude-3.5":
        model = "anthropic/claude-3.5-sonnet";
        break;
      case "claude-3.7":
        model = "anthropic/claude-3.7-sonnet";
        break;
      case "claude-3.5-haiku":
        model = "anthropic/claude-3.5-haiku";
        break;
      case "gemini-2.5-pro":
        model = "google/gemini-2.5-pro-preview-03-25";
        break;
      case "grok-3-beta":
        model = "x-ai/grok-3-beta";
        break;
      case "auto":
        // model = "openrouter/auto";
        model = "anthropic/claude-3.7-sonnet";
        break;
      case "gpt-4.1":
        model = "openai/gpt-4.1";
        break;
      case "deepseek-r1":
        model = "deepseek/deepseek-r1";
        break;
    }

    if (model !== "openai/gpt-4.5-preview") {
      initialGeneratingModel = model;
    }
  }

  const count = Math.max(parseInt(countString || "3"), notesToGenerate);
  let didConsumeCredits = false;
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

    console.log(
      "About to generate notes for userMetadata: ",
      JSON.stringify(userMetadata.publication.authorId),
    );
    const canUseAIResult = await canUseAI(
      session.user.id,
      "notesGeneration",
      notesToGenerate,
    );

    if (!canUseAIResult.result) {
      return NextResponse.json(
        { success: false, error: "Not enough credits" },
        { status: canUseAIResult.status },
      );
    }

    const { creditsUsed, creditsRemaining } = await useCredits(
      session.user.id,
      "notesGeneration",
      notesToGenerate,
    );
    didConsumeCredits = true;

    const authorId = userMetadata.publication.authorId;

    console.log("Author ID: ", authorId);

    const query = `${userMetadata.publication.preferredTopics || ""}, ${userMetadata.noteTopics}.`;

    const randomMinReaction = Math.floor(Math.random() * 400);
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

    console.log("About to run promises");
    console.time("promises");
    const [
      userNotes,
      notesUserDisliked,
      notesUserLiked,
      notesFromAuthor,
      byline,
      inspirations,
    ] = await Promise.all([
      prisma.note.findMany({
        where: {
          userId: session.user.id,
          isArchived: false,
        },
        take: 10,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.note.findMany({
        where: { userId: session.user.id, feedback: "dislike" },
        take: 10,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.note.findMany({
        where: { userId: session.user.id, feedback: "like" },
        take: 10,
        orderBy: { updatedAt: "desc" },
      }),
      prismaArticles.notesComments.findMany({
        where: {
          authorId: parseInt(authorId.toString()),
          noteIsRestacked: false,
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
        take: 10,
      }),
      getByline(parseInt(authorId.toString())),
      searchSimilarNotes({
        query,
        limit: 20,
        filters,
        maxMatch: 0.5,
      }),
    ]);
    console.timeEnd("promises");
    const uniqueInspirations = inspirations
      .filter(
        (note, index, self) =>
          index === self.findIndex(t => t.body === note.body),
      )
      .filter(
        note =>
          !notesUserDisliked.some(dislike => dislike.body === note.body) &&
          !notesUserLiked.some(like => like.body === note.body),
      )
      .slice(0, 10);

    // remove all userNotes that are in uniqueInspirations and in like and dislike
    const userNotesNoDuplicates = userNotes.filter(
      note =>
        !uniqueInspirations.some(
          inspiration => inspiration.body === note.body,
        ) &&
        !notesUserDisliked.some(dislike => dislike.body === note.body) &&
        !notesUserLiked.some(like => like.body === note.body),
    );

    let preSelectedArticles: Post[] = [];
    if (preSelectedPostIds && preSelectedPostIds.length > 0) {
      preSelectedArticles = await getPublicationByIds(preSelectedPostIds);
    }

    const generateNotesMessages = generateNotesPrompt(
      userMetadata,
      userMetadata.publication,
      uniqueInspirations.map((note: NotesComments) => note.body),
      notesFromAuthor.map(note => note.body),
      userNotesNoDuplicates,
      notesUserDisliked,
      notesUserLiked,
      {
        noteCount: count,
        maxLength: 280,
        noteTemplates: useTopTypes ? noteTemplates : [],
        topic,
        preSelectedArticles,
      },
    );

    const promptResponse = await runPrompt(
      generateNotesMessages,
      initialGeneratingModel,
    );
    let newNotes: {
      body: string;
      summary: string;
      topics: string[];
      inspiration: string;
      type: string;
    }[] = await parseJson(promptResponse);

    const newNotesWithIds = newNotes.map((note, index) => ({
      ...note,
      id: index,
    }));

    let improvedNotes: { id: number; body: string }[] = [];
    if (model !== initialGeneratingModel) {
      const improveNotesMessages = generateNotesWritingStylePrompt(
        userMetadata,
        userMetadata.publication,
        newNotesWithIds,
      );
      const improvedNotesResponse = await runPrompt(
        improveNotesMessages,
        model,
      );
      improvedNotes = await parseJson(improvedNotesResponse);
    }
    newNotes = newNotes.map((note, index) => {
      const improvedNote = improvedNotes.find(n => n.id === index);
      return improvedNote ? { ...note, body: improvedNote.body } : note;
    });
    // const newNotes3: any[] = await parseJson(promptResponse3);
    // newNotes = [...newNotes, ...newNotes2, ...newNotes3];

    const handle = byline?.handle || notesFromAuthor[0]?.handle;
    const name = byline?.name || notesFromAuthor[0]?.name;
    const thumbnail =
      byline?.photoUrl || notesFromAuthor[0]?.photoUrl || session.user.image;

    console.log("Handle: ", handle);
    console.log("Name: ", name);
    console.log("Thumbnail: ", thumbnail);

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
          generatingModel: model,
          initialGeneratingModel,
          name,
          inspiration: note.inspiration,
        },
      });
      notesCreated.push(newNote);
    }

    const notesResponse: NoteDraft[] = notesCreated.map((note: Note) => ({
      id: note.id,
      body: note.body,
      createdAt: note.createdAt,
      authorId: parseInt(authorId.toString()),
      authorName: note.name || "",
      handle: note.handle || "",
      status: note.status,
      thumbnail: note.thumbnail || undefined,
      scheduledTo: null,
      wasSentViaSchedule: false,
    }));

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
    if (didConsumeCredits) {
      await undoUseCredits(session.user.id, "notesGeneration", notesToGenerate);
    }
    const code = error.code || "unknown";
    if (code === 429 || error instanceof Model429Error) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 },
      );
    }
    loggerServer.error("Failed to fetch notes", {
      error,
      userId: session?.user.id,
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch notes" },
      { status: 500 },
    );
  } finally {
    console.timeEnd("generate notes");
    await prisma.$disconnect();
    await prismaArticles.$disconnect();
  }
}
