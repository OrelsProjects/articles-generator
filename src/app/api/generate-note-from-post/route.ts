import { fetchAllNoteComments } from "@/app/api/analyze-substack/utils";
import { extractPostContent } from "@/app/api/user/analyze/_utils";
import { authOptions } from "@/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { getByline } from "@/lib/dal/byline";
import { getUserNotes } from "@/lib/dal/note";
import { runPrompt } from "@/lib/open-router";
import { generateTeaserNotesPrompt } from "@/lib/prompts";
import { parseJson } from "@/lib/utils/json";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import TurndownService from "turndown";
import { z } from "zod";
import { Note, NoteStatus } from "@prisma/client";
import { NoteDraft } from "@/types/note";
import { getSubstackArticleData } from "@/lib/utils/article";

export const maxDuration = 300; // This function can run for a maximum of 5 minutes

const schema = z.object({
  postUrl: z.string(),
  authorId: z.number().optional(),
});

const MAX_NOTES_PER_WEEK = 4;

const updateNextAvailableDate = async (userId: string) => {
  const userUsage = await prisma.freeUsageNoteGeneration.findFirst({
    where: {
      userId,
    },
  });

  const nextWeekDate = new Date();
  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);

  if (!userUsage) {
    await prisma.freeUsageNoteGeneration.create({
      data: {
        userId,
        nextAvailableDate: nextWeekDate,
        maxNotes: MAX_NOTES_PER_WEEK,
        notesGenerated: 0,
      },
    });
    return;
  }

  // If next available date is null or more than a week ago, update to next week
  if (
    !userUsage.nextAvailableDate ||
    userUsage.nextAvailableDate < lastWeekDate
  ) {
    await prisma.freeUsageNoteGeneration.update({
      where: {
        id: userUsage.id,
      },
      data: {
        nextAvailableDate: nextWeekDate,
        notesGenerated: 0,
        maxNotes: MAX_NOTES_PER_WEEK,
      },
    });
  }
};

const useNoteGeneration = async (userId: string) => {
  const userUsage = await prisma.freeUsageNoteGeneration.findFirst({
    where: {
      userId,
    },
  });
  const nextAvailableDate = new Date();
  nextAvailableDate.setDate(nextAvailableDate.getDate() + 7);
  if (!userUsage) {
    await prisma.freeUsageNoteGeneration.create({
      data: {
        userId,
        nextAvailableDate,
        maxNotes: MAX_NOTES_PER_WEEK,
        notesGenerated: 1,
      },
    });
  } else {
    await prisma.freeUsageNoteGeneration.update({
      where: {
        id: userUsage.id,
      },
      data: {
        notesGenerated: userUsage.notesGenerated + 1,
      },
    });
  }
};

const undoUsage = async (userId: string) => {
  const userUsage = await prisma.freeUsageNoteGeneration.findFirst({
    where: {
      userId,
    },
  });

  if (!userUsage) {
    return;
  }

  await prisma.freeUsageNoteGeneration.update({
    where: { id: userUsage.id },
    data: { notesGenerated: userUsage.notesGenerated - 1 },
  });
};
const getNextGenerateDate = async (userId: string) => {
  const canGenerate = await canGenerateMoreNotes(userId);
  if (canGenerate) {
    return null;
  }
  const userUsage = await prisma.freeUsageNoteGeneration.findFirst({
    where: {
      userId,
    },
    select: {
      nextAvailableDate: true,
    },
  });

  if (!userUsage) {
    return null;
  }
  return userUsage.nextAvailableDate;
};

const canGenerateMoreNotes = async (userId: string) => {
  const userUsage = await prisma.freeUsageNoteGeneration.findFirst({
    where: {
      userId,
    },
    select: {
      nextAvailableDate: true,
      maxNotes: true,
      notesGenerated: true,
    },
  });

  if (!userUsage) {
    return true;
  }

  if (userUsage.notesGenerated < userUsage.maxNotes) {
    return true;
  }
  return false;
};

const getTodaysNotes = async (userId: string) => {
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  endOfDay.setHours(23, 59, 59, 999);

  const notes = await prisma.note.findMany({
    where: {
      userId,
      type: "free-article-teaser",
      isArchived: false,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return notes;
};

const generatingModel = "anthropic/claude-sonnet-4";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const todaysNotes = await getTodaysNotes(session.user.id);
    const noteDrafts: NoteDraft[] = todaysNotes.map(n => ({
      id: n.id,
      body: n.body,
      createdAt: n.createdAt,
      authorId: n.authorId,
      name: n.name || "",
      handle: n.handle || "",
      status: n.status,
      authorName: n.name || "",
      thumbnail: n.thumbnail || "",
      isArchived: n.isArchived,
      wasSentViaSchedule: false,
      attachments: [],
    }));

    loggerServer.info("[GENERATE-FREE-NOTE-FROM-POST] Getting todays notes", {
      userId: session.user.id,
      noteDrafts,
    });
    const canGenerate = await canGenerateMoreNotes(session.user.id);
    loggerServer.info("[GENERATE-FREE-NOTE-FROM-POST] Can generate", {
      userId: session.user.id,
      canGenerate,
    });
    let nextGenerateDate = null;
    if (!canGenerate) {
      nextGenerateDate = await getNextGenerateDate(session.user.id);
    }
    return NextResponse.json({
      success: true,
      data: noteDrafts,
      canGenerate,
      nextGenerateDate,
    });
  } catch (error) {
    loggerServer.error("Error getting todays notes", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Error getting todays notes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const text = await request.text();
  const body = JSON.parse(text);
  let parse = schema.safeParse(body);
  if (!parse.success) {
    const errors = parse.error.issues.map(issue => issue.message).join(", ");
    loggerServer.error("[GENERATE-FREE-NOTE-FROM-POST] Invalid request", {
      userId: session?.user.id || "unknown",
      body,
      errors,
    });
    return NextResponse.json(
      { error: "Invalid request body", errors },
      { status: 400 },
    );
  }
  try {
    const parsedBody = parse.data;
    if (!session) {
      if (parsedBody.authorId) {
        await fetchAllNoteComments(parsedBody.authorId, {
          maxNotes: 100,
          marginOfSafety: 1,
        });
        return NextResponse.json({
          success: true,
          notes: [],
          nextGenerateDate: null,
          requiresLogin: true,
        });
      }
      loggerServer.error("[GENERATE-FREE-NOTE-FROM-POST] Unauthorized", {
        userId: "unknown",
        body: parsedBody,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canGenerate = await canGenerateMoreNotes(session.user.id);
    if (!canGenerate) {
      const todaysNotes = await getTodaysNotes(session.user.id);
      loggerServer.warn(
        "[GENERATE-FREE-NOTE-FROM-POST] You have reached the maximum number of notes for today",
        {
          userId: session.user.id,
          todaysNotes,
        },
      );
      const nextGenerateDate = await getNextGenerateDate(session.user.id);
      return NextResponse.json(
        {
          error:
            "[GENERATE-FREE-NOTE-FROM-POST] You have reached the maximum number of notes for today",
          todaysNotes,
          nextGenerateDate,
        },
        { status: 402 },
      );
    }
    await useNoteGeneration(session.user.id);

    let authorId = session.user.meta?.tempAuthorId || parsedBody.authorId;
    if (!authorId) {
      const userMetadata = await prisma.userMetadata.findFirst({
        where: {
          userId: session.user.id,
        },
        select: {
          publication: {
            select: {
              authorId: true,
            },
          },
        },
      });
      authorId = userMetadata?.publication?.authorId;
    }

    if (!authorId) {
      loggerServer.error("[GENERATE-FREE-NOTE-FROM-POST] No author ID found", {
        userId: session.user.id,
      });
      return NextResponse.json(
        { error: "[GENERATE-FREE-NOTE-FROM-POST] No author ID found" },
        { status: 401 },
      );
    }

    const { postUrl } = parsedBody;
    loggerServer.info(
      "[GENERATE-FREE-NOTE-FROM-POST] Generating note from post",
      {
        userId: session.user.id,
        postUrl,
      },
    );
    const body = await getSubstackArticleData([postUrl]);
    // const { content } = await extractPostContent(postUrl);
    const turndownService = new TurndownService();
    const unmarkedData = turndownService.turndown(body[0].content);

    if (!unmarkedData) {
      loggerServer.error("[GENERATE-FREE-NOTE-FROM-POST] No content found", {
        userId: session.user.id,
        postUrl,
      });
      return NextResponse.json(
        { error: "[GENERATE-FREE-NOTE-FROM-POST] No content found" },
        { status: 400 },
      );
    }

    let byline = await getByline(parseInt(authorId.toString()));

    if (!byline) {
      loggerServer.error("[GENERATE-FREE-NOTE-FROM-POST] Byline not found", {
        userId: session.user.id,
        authorId,
      });
      return NextResponse.json(
        { error: "[GENERATE-FREE-NOTE-FROM-POST] Byline not found" },
        { status: 400 },
      );
    }

    let userNotes = await getUserNotes(session.user.id);
    if (userNotes.length === 0) {
      const { allNotes } = await fetchAllNoteComments(byline.id, {
        maxNotes: 100,
        marginOfSafety: 1,
      });
      userNotes = allNotes.sort((a, b) => b.reactionCount - a.reactionCount);
      userNotes = userNotes.slice(0, 20);
    }

    const handle = byline?.handle || userNotes[0]?.handle;
    const name = byline?.name || userNotes[0]?.name;
    const thumbnail =
      byline?.photoUrl || userNotes[0]?.photoUrl || session.user.image;

    const messages = generateTeaserNotesPrompt({
      userNotes: userNotes.map(n => n.body),
      articlesBody: [unmarkedData],
      options: {
        noteCount: 1,
        maxLength: 280,
      },
    });

    const response = await runPrompt(
      messages,
      generatingModel,
      session.user.name || "generate-note-from-post",
    );

    const newNotes = await parseJson<
      {
        body: string;
        summary: string;
        topics: string[];
        inspiration: string;
      }[]
    >(response);

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
          type: "free-article-teaser",
          authorId: byline.id,
          generatingModel,
          initialGeneratingModel: generatingModel,
          name,
          inspiration: note.inspiration,
        },
      });
      notesCreated.push(newNote);
    }

    const nextGenerateDate = await getNextGenerateDate(session.user.id);
    await updateNextAvailableDate(session.user.id);
    return NextResponse.json({
      success: true,
      notes: notesCreated,
      nextGenerateDate,
      canGenerate,
    });
  } catch (error) {
    loggerServer.error(
      "[GENERATE-FREE-NOTE-FROM-POST] Error generating note from post",
      {
        error,
        userId: session?.user.id || "unknown",
      },
    );
    if (session?.user.id) {
      await undoUsage(session.user.id);
    }
    return NextResponse.json(
      {
        error: "[GENERATE-FREE-NOTE-FROM-POST] Error generating note from post",
      },
      { status: 500 },
    );
  }
}
