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

export const maxDuration = 300; // This function can run for a maximum of 5 minutes

const schema = z.object({
  postUrl: z.string(),
  authorId: z.number().optional(),
});

const MAX_NOTES_PER_DAY = 2;

const getNextGenerateDate = async (userId: string) => {
  const canGenerate = await canGenerateMoreNotes(userId);
  if (canGenerate) {
    return null;
  }
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

  // Can generate 24 hours after the first generated note of today
  const lastGeneratedNote = await prisma.note.findFirst({
    where: {
      userId,
      type: "free-article-teaser",
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  // Calculate 24 hours after the first generated note of today
  if (!lastGeneratedNote) {
    return startOfDay;
  }
  const nextGenerateDate = new Date(lastGeneratedNote.createdAt);
  nextGenerateDate.setHours(nextGenerateDate.getHours() + 24);
  return nextGenerateDate;
};

const canGenerateMoreNotes = async (userId: string) => {
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

  const freeNotes = await prisma.note.count({
    where: {
      userId,
      type: "free-article-teaser",
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  return freeNotes < MAX_NOTES_PER_DAY;
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

const generatingModel = "anthropic/claude-3.7-sonnet";

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

    const canGenerate = await canGenerateMoreNotes(session.user.id);
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
  const body = await request.json();
  let parsedBody = schema.parse(body);
  if (!parsedBody) {
    loggerServer.error("Invalid request", {
      userId: session?.user.id || "unknown",
      body,
    });
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const canGenerate = await canGenerateMoreNotes(session.user.id);
    if (!canGenerate) {
      const todaysNotes = await getTodaysNotes(session.user.id);
      loggerServer.warn(
        "You have reached the maximum number of notes for today",
        {
          userId: session.user.id,
          todaysNotes,
        },
      );
      const nextGenerateDate = await getNextGenerateDate(session.user.id);
      return NextResponse.json(
        {
          error: "You have reached the maximum number of notes for today",
          todaysNotes,
          nextGenerateDate,
        },
        { status: 402 },
      );
    }

    if (!session.user.meta?.tempAuthorId) {
      loggerServer.error("No temp author ID found", {
        userId: session.user.id,
      });
      return NextResponse.json(
        { error: "No temp author ID found" },
        { status: 401 },
      );
    }

    const { postUrl } = parsedBody;
    loggerServer.info("Generating note from post", {
      userId: session.user.id,
      postUrl,
    });
    const { content } = await extractPostContent(postUrl);
    const turndownService = new TurndownService();
    const unmarkedData = turndownService.turndown(content);

    if (!unmarkedData) {
      return NextResponse.json({ error: "No content found" }, { status: 400 });
    }

    let byline = await getByline(parseInt(session.user.meta?.tempAuthorId));

    if (!byline) {
      return NextResponse.json({ error: "Byline not found" }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      notes: notesCreated,
      nextGenerateDate,
    });
  } catch (error) {
    loggerServer.error("Error generating note from post", {
      error,
      userId: session?.user.id || "unknown",
    });
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
