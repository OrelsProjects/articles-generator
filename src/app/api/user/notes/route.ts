import { NextRequest } from "next/server";

import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/app/api/_db/db";
import { NoteDraft } from "@/types/note";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || "200");

  try {
    const userNotes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
        isArchived: false,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: limit + 1, // Take one extra to know if there are more items
      ...(cursor
        ? {
            cursor: {
              id: cursor,
            },
            skip: 1, // Skip the cursor
          }
        : {}),
      include: {
        S3Attachment: {
          select: {
            id: true,
            s3Url: true,
            fileName: true,
          },
        },
      },
    });

    let nextCursor: string | undefined = undefined;
    if (userNotes.length > limit) {
      const nextItem = userNotes.pop(); // Remove the extra item
      nextCursor = nextItem?.id;
    }

    const response: NoteDraft[] = userNotes.map(note => ({
      id: note.id,
      thumbnail: note.thumbnail || session.user.image || undefined,
      body: note.body,
      createdAt: note.createdAt,
      authorId: note.authorId,
      authorName: note.name || session.user.name || "",
      status: note.status,
      feedback: note.feedback || undefined,
      name: note.name || undefined,
      handle: note.handle || undefined,
      scheduledTo: note.scheduledTo,
      wasSentViaSchedule: !!note.sentViaScheduleAt,
      attachments: note.S3Attachment.map(attachment => ({
        id: attachment.id,
        url: attachment.s3Url,
      })),
    }));

    return NextResponse.json({
      items: response,
      nextCursor,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 },
    );
  }
}
