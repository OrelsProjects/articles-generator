import prisma, { prismaArticles } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { Filter, searchSimilarNotes } from "@/lib/dal/milvus";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { NotesComments, Prisma } from "@/../prisma/generated/articles";
import { Note } from "@/types/note";
import { z } from "zod";

export const maxDuration = 150;

// zod this. Use InspirationFilters type
const InspirationFiltersSchema = z.object({
  minLikes: z.number().optional(),
  minComments: z.number().optional(),
  minRestacks: z.number().optional(),
  keyword: z.string().optional(),
  dateRange: z
    .object({
      from: z.string(),
      to: z.string().optional(),
    })
    .optional(),
  type: z.enum(["all", "relevant-to-user"]),
});

const bodySchema = z.object({
  existingNotesIds: z.array(z.string()),
  filters: InspirationFiltersSchema,
});

const filterNotes = (
  notes: NotesComments[],
  existingNotes: NotesComments[],
  limit: number,
) => {
  const existingNotesBodys = existingNotes.map(note => note.body.slice(0, 100));
  let newNotes = [...notes];
  newNotes = newNotes.filter(
    (note, index, self) =>
      index === self.findIndex(t => t.commentId === note.commentId),
  );
  newNotes = newNotes.sort((a, b) => b.reactionCount - a.reactionCount);
  newNotes = newNotes.filter(
    note => !existingNotesBodys.includes(note.body.slice(0, 100)),
  );

  newNotes = newNotes.filter(
    note =>
      !note.body.toLowerCase().includes("looking for") &&
      !note.body.toLowerCase().includes("connect with") &&
      !note.body.toLowerCase().includes("to connect"),
  );

  const notesWithLessThan50Characters = newNotes.filter(
    note => note.body.length < 50,
  );

  return [...notesWithLessThan50Characters, ...newNotes].slice(0, limit + 1); // Take one extra to know if there are more
};

export async function POST(req: NextRequest) {
  console.time("generate notes");
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = 16; // Number of items per page

  try {
    const body = await req.json();
    const parsedBody = bodySchema.parse(body);
    const { existingNotesIds, filters } = parsedBody;
    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        publication: true,
      },
    });

    const publication = userMetadata?.publication;

    if (!publication) {
      return NextResponse.json(
        { error: "Publication not found" },
        { status: 404 },
      );
    }

    const query =
      filters.keyword ||
      `
    ${publication.generatedDescriptionForSearch || publication.generatedDescription}
     `;

    const shouldMilvusSearch = filters.type === "relevant-to-user";

    const likes = filters.minLikes;
    const minLikes = likes ? likes : 3000;
    const extraMinLikes = likes ? likes : 50;
    const minRandom = likes ? Math.random() / 2 : Math.random();
    const maxLikes = likes ? likes * 2 : 5000;
    const extraMaxLikes = likes ? likes * 2 : 0;
    const maxRandom = likes ? Math.random() / 10 : Math.random();

    const randomMinReaction = Math.floor(minRandom * minLikes + extraMinLikes);
    const randomMaxReaction = Math.floor(maxRandom * maxLikes + extraMaxLikes);

    const searchFilters: Filter[] = [
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

    if (existingNotesIds.length > 0) {
      searchFilters.push({
        leftSideValue: "id",
        rightSideValue: `["${existingNotesIds.join('","')}"]`,
        operator: "not in",
      });
    }

    if (filters.dateRange) {
      if (filters.dateRange.from) {
        searchFilters.push({
          leftSideValue: "date",
          rightSideValue: new Date(filters.dateRange.from).getTime(),
          operator: ">=",
        });
      }
      if (filters.dateRange.to) {
        searchFilters.push({
          leftSideValue: "date",
          rightSideValue: new Date(filters.dateRange.to).getTime(),
          operator: "<=",
        });
      }
    }

    if (filters.minComments) {
      searchFilters.push({
        leftSideValue: "comment_count",
        rightSideValue: filters.minComments.toString(),
        operator: ">=",
      });
    }

    if (filters.minRestacks) {
      searchFilters.push({
        leftSideValue: "restack_count",
        rightSideValue: filters.minRestacks.toString(),
        operator: ">=",
      });
    }

    if (filters.minLikes) {
      searchFilters.push({
        leftSideValue: "reaction_count",
        rightSideValue: filters.minLikes.toString(),
        operator: ">=",
      });
    }

    console.log("searchFilters", searchFilters);
    console.log("Query", query);

    // If it's relevant to user, we search through milvus. otherwise, we search through the database
    let inspirationNotes: NotesComments[] = [];
    if (shouldMilvusSearch) {
      inspirationNotes = await searchSimilarNotes({
        query,
        limit: 100 + existingNotesIds.length,
        filters: searchFilters,
        minMatch: 0.2,
      });
    } else {
      console.time("prisma - long query");
      inspirationNotes = await prismaArticles.notesComments.findMany({
        where: {
          commentId: {
            notIn: existingNotesIds,
          },
          noteIsRestacked: false,
          reactionCount: {
            gte: filters.minLikes || 0,
          },
          commentsCount: {
            gte: filters.minComments || 0,
          },
          restacks: {
            gte: filters.minRestacks || 0,
          },
          date: filters.dateRange
            ? {
                gte: filters.dateRange.from,
                lte: filters.dateRange.to,
              }
            : undefined,
          body: filters.keyword
            ? {
                contains: filters.keyword,
                mode: "insensitive", // Case insensitive
              }
            : undefined,
        },
        orderBy: {
          reactionCount: "asc",
        },
        take: 500,
      });

      // console.time("prisma - long query");
      // inspirationNotes = await prismaArticles.$queryRaw`
      //   SELECT * FROM "notes_comments"
      //   WHERE "note_is_restacked" = false
      //   ${existingNotesIds.length > 0 ? Prisma.sql`AND "id" NOT IN (${Prisma.join(existingNotesIds)})` : Prisma.empty}
      //   AND "reaction_count" >= ${filters.minLikes || 0}
      //   AND "children_count" >= ${filters.minComments || 0}
      //   AND "restacks" >= ${filters.minRestacks || 0}
      //   ${filters.dateRange ? Prisma.sql`AND "date" BETWEEN ${filters.dateRange.from} AND ${filters.dateRange.to}` : Prisma.empty}
      //   ${filters.keyword ? Prisma.sql`AND "body" % ${filters.keyword}` : Prisma.empty}
      //   ORDER BY "reaction_count" ASC
      //   LIMIT 500;
      // `;
      console.timeEnd("prisma - long query");
      inspirationNotes = inspirationNotes
        .sort(() => Math.random() - 0.5)
        .slice(0, limit);
    }

    const existingNotes = await prismaArticles.notesComments.findMany({
      where: {
        commentId: {
          in: existingNotesIds,
        },
      },
      distinct: ["commentId"],
    });

    const filteredNotes = filterNotes(
      inspirationNotes,
      existingNotes,
      existingNotes.length + limit,
    );
    let nextCursor: string | undefined = undefined;

    const hasMore = filteredNotes.length > 0;

    if (filteredNotes.length > limit) {
      const nextItem = filteredNotes.pop(); // Remove the extra item
      nextCursor = nextItem?.commentId;
    }

    const attachments = await prismaArticles.notesAttachments.findMany({
      where: {
        noteId: {
          in: filteredNotes.map(note => parseInt(note.commentId)),
        },
      },
    });

    const filteredNotesWithAttachments = filteredNotes.map(note => {
      const attachment = attachments.find(
        attachment => attachment.noteId === parseInt(note.commentId),
      );
      return { ...note, attachment: attachment?.imageUrl };
    });

    const notesResponse: Note[] = filteredNotesWithAttachments.map(note => ({
      id: note.commentId,
      content: note.body,
      jsonBody: note.bodyJson as any[],
      timestamp: note.date,
      authorId: note.authorId,
      authorName: note.name,
      body: note.body,
      handle: note.handle,
      thumbnail: note.photoUrl || undefined,
      reactionCount: note.reactionCount,
      entityKey: note.entityKey,
      commentsCount: note.commentsCount || 0,
      restacks: note.restacks,
      attachment: note.attachment || undefined,
    }));

    return NextResponse.json({
      items: notesResponse,
      nextCursor,
      hasMore,
    });
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
