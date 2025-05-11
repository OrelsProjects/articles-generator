import { NextRequest, NextResponse } from "next/server";
import { Streak } from "@/types/notes-stats";
import { fetchAllNoteComments } from "@/app/api/analyze-substack/utils";
import { calculateStreak } from "@/lib/dal/notes-stats";
import { prismaArticles, prisma } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { NotesComments } from "../../../../../prisma/generated/articles";
import loggerServer from "@/loggerServer";
import { scrapePosts } from "@/lib/utils/publication";

const schema = z
  .object({
    includePosts: z.boolean().optional().default(false),
    // types of string: "streak | engagement"
    object: z.enum(["streak", "engagement"]).optional(),
    url: z.string().optional(),
  })
  .optional();

const insertIntoDB = async (notes: NotesComments[], authorId: number) => {
  for (const note of notes) {
    const noteDB = {
      ...note,
      commentId: note.commentId,
      type: note.type,
      authorId: authorId,
      body: note.body,
      date: note.date,
      handle: note.handle,
      name: note.name,
      photoUrl: note.photoUrl,
      reactionCount: note.reactionCount,
      reactions: {},
      commentsCount: note.commentsCount,
      restacks: note.restacks,
      restacked: note.restacked,
      timestamp: note.timestamp,
      contextType: note.contextType,
      entityKey: note.entityKey,
      noteIsRestacked: note.noteIsRestacked,
    };

    await prismaArticles.notesComments.upsert({
      where: {
        commentId_authorId: {
          commentId: noteDB.commentId,
          authorId: noteDB.authorId,
        },
      },
      update: {
        reactions: noteDB.reactions,
        reactionCount: noteDB.reactionCount,
        commentsCount: noteDB.commentsCount,
        restacks: noteDB.restacks,
        restacked: noteDB.restacked,
        timestamp: noteDB.timestamp,
        contextType: noteDB.contextType,
        entityKey: noteDB.entityKey,
      },
      create: {
        ...noteDB,
      },
    });
  }
};

export const maxDuration = 360; // This function can run for a maximum of 5 minutes

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: {
      authorId: string[];
    };
  },
) {
  const session = await getServerSession(authOptions);

  const { authorId: authorIds } = params;
  const authorId = authorIds?.[0];
  let validAuthorIdString = session?.user.meta?.tempAuthorId || authorId;
  let validAuthorId: number | null = parseInt(validAuthorIdString);

  try {
    let validObject = "streak";
    let validUrl: string | null = null;
    let includePosts = false;
    let parsedBody = null;
    try {
      const body = await request.json();
      parsedBody = schema.safeParse(body);
    } catch (error) {
      loggerServer.error("Error in analyze-substack API:", {
        error,
        userId: session?.user.id || "system",
        authorId: params.authorId[0],
      });
    }

    if (parsedBody?.success && !session && parsedBody.data) {
      const { includePosts: includePostsParam, object, url } = parsedBody.data;
      validObject = object || "streak";
      validUrl = url || null;
      includePosts = includePostsParam || false;
    }

    if (validObject === "engagement" && !validUrl) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    if (!validAuthorId || isNaN(validAuthorId)) {
      if (session) {
        const userMetadata = await prisma.userMetadata.findUnique({
          where: {
            userId: session.user.id,
          },
          select: {
            publication: true,
          },
        });
        validAuthorId = userMetadata?.publication?.authorId || null;
        if (validAuthorId) {
          await prisma.userMetadata.update({
            where: {
              userId: session.user.id,
            },
            data: {
              tempAuthorId: validAuthorId,
            },
          });
        }
      }
      if (!validAuthorId) {
        return NextResponse.json(
          { error: "Missing authorId" },
          { status: 400 },
        );
      }
    }

    console.time("fetchAllNoteComments");
    const promises: Promise<any>[] = [];
    if (includePosts && validUrl) {
      promises.push(
        scrapePosts(validUrl, 0, validAuthorId, {
          stopIfNoNewPosts: true,
        }),
      );
    }
    promises.push(fetchAllNoteComments(validAuthorId));
    const [{ allNotes, newNotes }] = await Promise.all(promises);
    console.timeEnd("fetchAllNoteComments");

    insertIntoDB(newNotes, validAuthorId).then(() => {
      loggerServer.info("All notes inserted into DB", {
        userId: session?.user.id || "system",
        authorId: validAuthorId,
      });
    });

    if (session) {
      if (validObject === "streak") {
        const streakData: Streak[] = calculateStreak(allNotes);
        return NextResponse.json({ success: true, streakData });
      }
      if (validObject === "engagement") {
        // const engagementData: Engagement[] = calculateEngagement(allNotes);
        // return NextResponse.json({ success: true, engagementData });
      }
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    loggerServer.error("Error in analyze-substack API:", {
      error,
      userId: session?.user.id || "system",
      authorId: params.authorId[0],
    });
    return NextResponse.json(
      { error: "Failed to analyze Substack" },
      { status: 500 },
    );
  }
}
