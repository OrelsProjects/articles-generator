import { NextRequest, NextResponse } from "next/server";
import { Streak } from "@/types/notes-stats";
import { fetchAllNoteComments } from "@/app/api/analyze-substack/utils";
import { calculateStreak } from "@/lib/dal/notes-stats";
import { prismaArticles, prisma } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";

export const maxDuration = 360; // This function can run for a maximum of 5 minutes

export async function GET(
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

  try {
    const { authorId: authorIds } = params;
    const authorId = authorIds?.[0];
    let validAuthorIdString = session?.user.meta?.tempAuthorId || authorId;
    let validAuthorId: number | null = parseInt(validAuthorIdString);

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
    const { allNotes, newNotes } = await fetchAllNoteComments(validAuthorId);
    console.timeEnd("fetchAllNoteComments");

    for (const note of newNotes) {
      const noteDB = {
        ...note,
        commentId: note.commentId,
        type: note.type,
        authorId: validAuthorId,
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

    if (session) {
      const streakData: Streak[] = calculateStreak(allNotes);
      return NextResponse.json({ success: true, streakData });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in analyze-substack API:", error);
    return NextResponse.json(
      { error: "Failed to analyze Substack" },
      { status: 500 },
    );
  }
}
