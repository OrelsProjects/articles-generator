import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prismaArticles } from "@/lib/prisma";
import { decodeKey, getExtensionKey } from "@/lib/dal/extension-key";
import { z } from "zod";
import { UserWriterWithData } from "@/types/writer";
import { getBylineByUserId } from "@/lib/dal/byline";
import { NotesComments } from "../../../../../prisma/generated/articles";
import _ from "lodash";
import { AttachmentType } from "@prisma/client";

const orderParamsForNotesComments = [
  "reactionCount",
  "commentsCount",
  "restacks",
];

const querySchema = z.object({
  orderBy: z
    .enum([
      "notePostedAt",
      "totalClicks",
      "totalFollows",
      "totalPaidSubscriptions",
      "totalFreeSubscriptions",
      "reactionCount",
      "commentsCount",
      "restacks",
    ])
    .optional()
    .nullable()
    .default("totalClicks"),
  orderDirection: z.enum(["asc", "desc"]).optional().nullable().default("desc"),
  page: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val ? parseInt(val) : 30)),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    loggerServer.warn("Unauthorized, no session in get notes for stats", {
      userId: "not logged in",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = await getExtensionKey(session.user.id, true);
  if (!key) {
    loggerServer.warn(
      "[GETTING-NOTES-FOR-STATS] Unauthorized, no extension key",
      {
        userId: "unknown",
      },
    );
    return NextResponse.json(
      {
        error: "Make sure you have the extension installed",
      },
      { status: 403 },
    );
  }
  const decoded = decodeKey(key);
  const userId = decoded.userId;
  const authorId = decoded.authorId;
  if (!userId) {
    loggerServer.warn(
      "[GETTING-NOTES-FOR-STATS] Unauthorized, no userId in key",
      {
        userId: "not logged in",
      },
    );
    return NextResponse.json(
      {
        error:
          "Make sure you are connected to the same account on WriteStack and on Substack",
      },
      { status: 401 },
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const orderBy = searchParams.get("orderBy");
    const orderDirection = searchParams.get("orderDirection");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");

    const dataParsed = querySchema.safeParse({
      orderBy,
      orderDirection,
      page,
      limit,
    });

    if (dataParsed.error) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 },
      );
    }

    const data = dataParsed.data;

    const orderByParam = data.orderBy || "totalClicks";
    const orderDirectionParam = data.orderDirection || "desc";
    const pageParam = data.page || 1;
    const limitParam = data.limit || 30;

    // if the orderBy is reactionCount/commentsCount/restacks, we need to pull first from notesComments then get the stats
    const isNotesCommentsOrder =
      orderParamsForNotesComments.includes(orderByParam);
    let notesComments: Pick<NotesComments, "commentId">[] = [];
    if (isNotesCommentsOrder) {
      notesComments = await prismaArticles.notesComments.findMany({
        where: {
          authorId,
          noteIsRestacked: false,
        },
        orderBy: {
          [orderByParam]: orderDirectionParam,
        },
        skip: (pageParam - 1) * limitParam,
        take: limitParam,
        select: {
          commentId: true,
        },
      });
    }

    const notesCommentsIds: string[] = notesComments.map(
      note => note.commentId && note.commentId,
    );

    const notesStats = isNotesCommentsOrder
      ? await prismaArticles.notesCommentsStats.findMany({
          where: {
            commentId: {
              in: notesCommentsIds,
            },
          },
          include: {
            comment: true,
          },
        })
      : await prismaArticles.notesCommentsStats.findMany({
          where: {
            authorId,
          },
          orderBy: {
            [orderByParam]: orderDirectionParam,
          },
          skip: (pageParam - 1) * limitParam,
          take: limitParam,
          include: {
            comment: true,
          },
        });

    const orderNotesStats = isNotesCommentsOrder
      ? notesComments
          .map(note => {
            const stats = notesStats.find(
              stat => stat.commentId === note.commentId,
            );
            if (!stats) {
              return null;
            }
            return {
              ...stats,
              comment: stats.comment,
            };
          })
          .filter(stat => stat !== null)
      : notesStats;

    const byline = await getBylineByUserId(session.user.id);

    const notesAttachments = await prismaArticles.notesAttachments.findMany({
      where: {
        noteId: {
          in: orderNotesStats.map(note => Number(note.commentId)),
        },
      },
    });

    const notesWithAttachments = orderNotesStats.map(note => ({
      ...note,
      attachments: notesAttachments.filter(
        attachment =>
          attachment.noteId === Number(note.commentId) &&
          attachment.imageUrl !== "",
      ),
    }));

    const response: UserWriterWithData = {
      bio: byline?.bio || "",
      handle: byline?.handle || "",
      name: byline?.name || "",
      photoUrl: byline?.photoUrl || "",
      authorId: byline?.id?.toString() || "",
      topNotes: notesWithAttachments.map(
        ({ comment: note, attachments, ...stats }) => {
          const attachmentsWithUrl = attachments
            .filter(attachment => !!attachment.imageUrl)
            .map(attachment => ({
              id: attachment.id,
              url: attachment.imageUrl || "",
              type: attachment.type as AttachmentType,
            }));
          return {
            id: note.commentId,
            body: note.body,
            date: new Date(note.date),
            handle: note.handle || "",
            name: note.name || "",
            photoUrl: note.photoUrl || "",
            attachments: attachmentsWithUrl || [],
            reactionCount: note.reactionCount || 0,
            commentsCount: note.commentsCount || 0,
            restacks: note.restacks || 0,
            totalClicks: stats.totalClicks || 0,
            totalFollows: stats.totalFollows || 0,
            totalPaidSubscriptions: stats.totalPaidSubscriptions || 0,
            totalFreeSubscriptions: stats.totalFreeSubscriptions || 0,
            totalArr: stats.totalArr || 0,
            totalShareClicks: stats.totalShareClicks || 0,
          };
        },
      ),
    };

    const hasMore = notesStats.length === limitParam;

    return NextResponse.json({ response, hasMore });
  } catch (error: any) {
    loggerServer.error("Error getting notes engagement stats", {
      error,
      userId,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
