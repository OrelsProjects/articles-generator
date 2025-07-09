import { prisma, prismaArticles } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import { Filter, searchSimilarNotes } from "@/lib/dal/milvus";
import {
  generateNotesPrompt_v2,
  GenerateNotesPromptBody,
  generateNotesWritingStylePrompt_v2,
} from "@/lib/prompts";
import loggerServer from "@/loggerServer";
import { getServerSession, Session } from "next-auth";
import { Post } from "@/../prisma/generated/articles";
import { Model, runPrompt } from "@/lib/open-router";
import { parseJson } from "@/lib/utils/json";
import {
  FeatureFlag,
  Note,
  NoteStatus,
  PublicationMetadata,
  UserMetadata,
} from "@prisma/client";
import { NoteDraft } from "@/types/note";
import { canUseAI, undoUseCredits, useCredits } from "@/lib/utils/credits";
import { AIUsageResponse } from "@/types/aiUsageResponse";
import { getByline } from "@/lib/dal/byline";
import { Model429Error } from "@/types/errors/Model429Error";
import { getPublicationByIds } from "@/lib/dal/publication";
import { formatNote } from "@/lib/utils/notes";
import { GhostwriterDAL } from "@/lib/dal/ghostwriter";

export const maxDuration = 300; // This function can run for a maximum of 5 minutes

const modelsRequireImprovement = [
  "anthropic/claude-3.5-haiku",
  "openai/gpt-4.1",
  "x-ai/grok-3-beta",
];

export async function generateNotesPrompt({
  notesCount,
  requestedModel,
  topic,
  preSelectedPostIds,
  userMetadata,
  includeArticleLinks = false,
  length,
}: {
  userMetadata: UserMetadata & { publication: PublicationMetadata };
  notesCount?: number;
  requestedModel?: string;
  topic?: string;
  preSelectedPostIds?: string[];
  includeArticleLinks?: boolean;
  length?: {
    min: number;
    max: number;
  };
}) {
  const userId = userMetadata.userId;
  const featureFlags = userMetadata.featureFlags || [];
  const count = notesCount || userMetadata.notesToGenerateCount || 3;

  let initialGeneratingModel: Model = "anthropic/claude-3.7-sonnet";
  let model: Model = "openrouter/auto";

  if (requestedModel && featureFlags.includes(FeatureFlag.advancedGPT)) {
    switch (requestedModel) {
      case "gpt-4.5":
        model = "openai/gpt-4.5-preview";
        break;
      case "claude-sonnet-4":
        model = "anthropic/claude-sonnet-4";
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

  const publicationId = userMetadata?.publication?.idInArticlesDb;

  if (!publicationId || !userMetadata.publication) {
    loggerServer.error("Publication not found", {
      userId,
      publicationId,
      userMetadata,
    });
    return {
      success: false,
      errorMessage: "Publication not found",
      status: 404,
    };
  }

  console.log(
    "About to generate notes for userMetadata: ",
    JSON.stringify(userMetadata.publication.authorId),
    "For topic: ",
    topic,
  );
  const canUseAIResult = await canUseAI(userId, "notesGeneration", count);

  if (!canUseAIResult.result) {
    loggerServer.error("User tried to generate notes but not enough credits", {
      userId,
    });
    return {
      success: false,
      errorMessage: "Not enough credits",
      status: canUseAIResult.status,
    };
  }

  const authorId = userMetadata.publication.authorId;

  console.log("Author ID: ", authorId);

  const query = `${userMetadata.publication.preferredTopics || ""}, ${userMetadata.noteTopics}.`;

  loggerServer.info("Query: ", { query, userId });

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
  const [userNotes, notesFromAuthor, inspirations] = await Promise.all([
    prisma.note.findMany({
      where: {
        AND: [
          { userId },
          { isArchived: false },
          {
            OR: [{ status: "published" }, { status: "scheduled" }],
          },
        ],
      },
      take: 15,
      orderBy: { updatedAt: "desc" },
    }),
    prismaArticles.notesComments.findMany({
      where: {
        AND: [
          { authorId: parseInt(authorId.toString()) },
          { noteIsRestacked: false },
        ],
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
      take: 15,
    }),
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
    .slice(0, 15);

  // remove all userNotes that are in uniqueInspirations and in like and dislike
  const userNotesNoDuplicates = userNotes.filter(
    note =>
      !uniqueInspirations.some(inspiration => inspiration.body === note.body),
  );

  let preSelectedArticles: Post[] = [];
  if (preSelectedPostIds && preSelectedPostIds.length > 0) {
    preSelectedArticles = await getPublicationByIds(preSelectedPostIds);
  }
  const promptBody: GenerateNotesPromptBody = {
    userMetadata,
    publication: userMetadata.publication,
    inspirationNotes: [],
    postedOnSubstackNotes: notesFromAuthor.map(note => note.body),
    userNotes: userNotesNoDuplicates,
    options: {
      noteCount: count,
      length,
      topic,
      preSelectedArticles,
      language: userMetadata.preferredLanguage || undefined,
      includeArticleLinks,
    },
  };
  const generateNotesMessages =
    userMetadata.notesPromptVersion === 1
      ? generateNotesPrompt_v2(promptBody)
      : generateNotesPrompt_v2(promptBody);
  return {
    messages: generateNotesMessages,
    model,
    initialGeneratingModel,
    notesFromAuthor,
  };
}

export async function generateNotes({
  notesCount,
  requestedModel,
  topic,
  preSelectedPostIds,
  takeCreditPerNote = true,
  includeArticleLinks = false,
  clientId,
  userSession,
  length,
}: {
  notesCount?: number;
  requestedModel?: string;
  topic?: string;
  preSelectedPostIds?: string[];
  takeCreditPerNote?: boolean;
  includeArticleLinks?: boolean;
  clientId?: string | null;
  userSession?: Session;
  length?: {
    min: number;
    max: number;
  };
}): Promise<{
  success: boolean;
  errorMessage?: string;
  status: number;
  data?: AIUsageResponse<NoteDraft[]>;
}> {
  let didConsumeCredits = false;
  let userId: string = "unknown";
  let ghostwriterUserId: string | undefined;
  let session: Session | null;

  const cost = takeCreditPerNote ? notesCount || 3 : 1;
  try {
    console.time("generate notes");
    if (!userSession) {
      session = await getServerSession(authOptions);
      if (!session) {
        throw new Error("Unauthorized");
      } 
    } else {
      session = userSession;
    }

    userId = session.user.id;

    if (clientId && userId !== clientId) {
      const canRun = await GhostwriterDAL.canRunOnBehalfOf({
        ghostwriterUserId: userId,
        clientId,
      });
      if (!canRun) {
        return {
          success: false,
          errorMessage:
            "You are not allowed to run this on behalf of this client",
          status: 403,
        };
      } else {
        ghostwriterUserId = userId;
        userId = clientId;
      }
    }

    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId,
      },
      include: {
        publication: true,
      },
    });

    if (!userMetadata || !userMetadata.publication) {
      return {
        success: false,
        errorMessage: "User metadata or publication not found",
        status: 404,
      };
    }

    const authorId = userMetadata.publication.authorId;

    const { creditsUsed, creditsRemaining } = await useCredits(
      userId,
      "notesGeneration",
      cost,
    );
    didConsumeCredits = true;

    const { messages, model, initialGeneratingModel, notesFromAuthor } =
      await generateNotesPrompt({
        notesCount,
        requestedModel,
        topic,
        preSelectedPostIds,
        userMetadata: userMetadata as UserMetadata & {
          publication: PublicationMetadata;
        },
        includeArticleLinks,
        length,
      });

    if (!messages) {
      return {
        success: false,
        errorMessage: "Failed to generate notes",
        status: 500,
      };
    }
    const promptResponse = await runPrompt(
      messages,
      initialGeneratingModel,
      "N-GEN-" + session.user.name,
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

    // Improve notes
    let improvedNotes: { id: number; body: string }[] = [];
    const shouldImprove =
      model !== initialGeneratingModel ||
      modelsRequireImprovement.includes(model);

    if (shouldImprove) {
      const improveNoteBody = {
        userMetadata: userMetadata as UserMetadata & {
          publication: PublicationMetadata;
        },
        publication: userMetadata.publication,
        notesToImprove: newNotesWithIds,
        language: userMetadata.preferredLanguage || undefined,
      };
      const improveNotesMessages =
        generateNotesWritingStylePrompt_v2(improveNoteBody);
      const improvedNotesResponse = await runPrompt(
        improveNotesMessages,
        model === "openai/gpt-4.5-preview"
          ? "openai/gpt-4.5-preview"
          : "anthropic/claude-3.7-sonnet",
        "N-GEN-" + session.user.name,
      );
      improvedNotes = await parseJson(improvedNotesResponse);
    }
    
    // Save notes
    newNotes = newNotes
      .map((note, index) => {
        const improvedNote = improvedNotes.find(n => n.id === index);
        return improvedNote ? { ...note, body: improvedNote.body } : note;
      })
      .map(formatNote);

    const byline = await getByline(parseInt(authorId.toString()));

    const handle = byline?.handle || notesFromAuthor[0]?.handle;
    const name = byline?.name || notesFromAuthor[0]?.name;
    let thumbnail = byline?.photoUrl || notesFromAuthor[0]?.photoUrl;

    if (!thumbnail) {
      if (clientId) {
        const user = await prisma.user.findUnique({
          where: {
            id: clientId,
          },
        });
        thumbnail = user?.image || null;
      } else {
        thumbnail = session.user.image || null;
      }
    }

    const notesCreated: Note[] = [];
    for (const note of newNotes) {
      const newNote = await prisma.note.create({
        data: {
          body: note.body,
          summary: note.summary,
          topics: note.topics,
          userId: clientId || session.user.id,
          status: NoteStatus.draft,
          handle,
          thumbnail,
          type: note.type,
          authorId: parseInt(authorId.toString()),
          generatingModel: model,
          initialGeneratingModel,
          name,
          inspiration: note.inspiration,
          ghostwriterUserId: ghostwriterUserId,
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
      ghostwriterUserId: note.ghostwriterUserId || undefined,
    }));

    const response: AIUsageResponse<NoteDraft[]> = {
      responseBody: {
        body: notesResponse,
        creditsUsed,
        creditsRemaining,
        type: "notesGeneration",
      },
    };
    return {
      success: true,
      status: 200,
      data: response,
    };
  } catch (error: any) {
    if (didConsumeCredits) {
      await undoUseCredits(userId, "notesGeneration", cost);
    }
    const code = error.code || "unknown";
    if (code === 429 || error instanceof Model429Error) {
      loggerServer.error("Rate limit exceeded", {
        error,
        userId,
      });
      return {
        success: false,
        errorMessage: "Rate limit exceeded",
        status: 429,
      };
    }
    loggerServer.error("Failed to generate notes", {
      error,
      userId,
    });
    return {
      success: false,
      errorMessage: "Failed to generate notes",
      status: 500,
    };
  } finally {
    console.timeEnd("generate notes");
  }
}
