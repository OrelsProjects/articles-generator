import { prisma, prismaArticles } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import { Filter, searchSimilarNotes } from "@/lib/dal/milvus";
import { searchInMeili } from "@/lib/dal/meilisearch";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { NotesComments } from "@/../prisma/generated/articles";
import { InspirationNote } from "@/types/note";
import { z } from "zod";
import { generateVectorSearchOptimizedDescriptionPrompt } from "@/lib/prompts";
import { runPrompt } from "@/lib/open-router";
import { parseJson } from "@/lib/utils/json";
import { setUserNotesDescription } from "@/lib/dal/analysis";

export const maxDuration = 300;

const getUserNotesDescription = async (
  userMetadata: {
    userId: string;
    notesDescription: string | null;
  },
  authorId: number,
  publicationId: string,
) => {
  let validUserMetadata = { ...userMetadata };
  if (!userMetadata.notesDescription) {
    await setUserNotesDescription(userMetadata.userId, authorId);
  }
  const newUserMetadata = await prisma.userMetadata.findUnique({
    where: { userId: userMetadata.userId },
    select: {
      userId: true,
      notesDescription: true,
    },
  });

  if (!newUserMetadata) {
    return null;
  }

  validUserMetadata = {
    userId: newUserMetadata?.userId,
    notesDescription: newUserMetadata?.notesDescription,
  };
  const prompt =
    generateVectorSearchOptimizedDescriptionPrompt(validUserMetadata);
  const [deepseek] = await Promise.all([
    runPrompt(prompt, "deepseek/deepseek-r1", "G-N-DESC-" + userMetadata.userId),
    // runPrompt(prompt, "openai/gpt-4.1"),
    // runPrompt(prompt, "openai/gpt-4.5-preview"),
    // runPrompt(prompt, "x-ai/grok-3-beta"),
    // runPrompt(prompt, "anthropic/claude-3.7-sonnet"),
    // runPrompt(prompt, "google/gemini-2.5-pro-preview-03-25"),
  ]);

  const result = await parseJson<{
    optimizedDescription: string;
  }>(deepseek);

  await prisma.publicationMetadata.update({
    where: { id: publicationId },
    data: {
      generatedDescriptionForSearch: result.optimizedDescription,
    },
  });

  return result.optimizedDescription;
};

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
  page: z.number().optional(),
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

  newNotes = newNotes.filter(
    note => !existingNotesBodys.includes(note.body.slice(0, 100)),
  );

  newNotes = newNotes.filter(
    note =>
      !note.body.toLowerCase().includes("looking for") &&
      !note.body.toLowerCase().includes("connect with") &&
      !note.body.toLowerCase().includes("to connect"),
  );

  // newNotes = newNotes.filter(note => note.body.length > 50);

  newNotes = newNotes.filter(
    (note, index, self) =>
      index ===
      self.findIndex(t => t.date === note.date && t.authorId === note.authorId),
  );
  // Differentiate by date

  return [...newNotes].slice(0, limit + 1); // Take one extra to know if there are more
};

export async function POST(req: NextRequest) {
  console.time("generate notes");
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { existingNotesIds, page = 1, filters } = bodySchema.parse(body);
    console.log("Page", page);
    const limit = 20; // Number of items per page

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

    let query =
      filters.keyword?.toLocaleLowerCase() ||
      `
    ${publication.generatedDescriptionForSearch}`;

    if (!userMetadata.notesDescription) {
      const result = await getUserNotesDescription(
        {
          userId: userMetadata.userId,
          notesDescription: userMetadata.notesDescription,
        },
        publication.authorId,
        publication.id,
      );
      query = result || query;
    }
    const shouldMilvusSearch = filters.type === "relevant-to-user";

    const likes = filters.minLikes;
    const minLikes = likes ? likes : 50;
    const extraMinLikes = likes ? likes : 0;
    const minRandom = likes ? Math.random() / 2 : Math.random();
    const maxLikes = likes ? likes * 2 : 5000;
    const extraMaxLikes = likes ? likes * 2 : 0;
    const maxRandom = likes ? Math.random() / 10 : Math.random();

    let randomMinReaction = Math.floor(minRandom * minLikes + extraMinLikes);
    let randomMaxReaction = Math.floor(maxRandom * maxLikes + extraMaxLikes);

    if (randomMaxReaction > randomMaxReaction) {
      let temp = randomMaxReaction;
      randomMaxReaction = randomMinReaction;
      randomMinReaction = temp;
    }

    let searchFilters: Filter[] = [
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
      // Clear the previous reaction_count filter
      searchFilters = searchFilters.filter(
        filter => filter.leftSideValue !== "reaction_count",
      );
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
      });
    } else {
      const { type, ...filtersNoType } = filters;
      inspirationNotes = await searchInMeili({
        keyword: filters.keyword,
        filters: filtersNoType,
        existingNotesIds,
        limit,
        page,
      });

      inspirationNotes = inspirationNotes
        .sort(() => Math.random() - 0.5)
        .slice(0, limit);
    }
    let existingNotes: NotesComments[] = [];
    if (existingNotesIds.length > 0) {
      existingNotes = await prismaArticles.notesComments.findMany({
        where: {
          commentId: {
            in: existingNotesIds,
          },
          noteIsRestacked: false,
        },
        distinct: ["commentId"],
      });
    }

    const filteredNotes = filterNotes(
      inspirationNotes,
      existingNotes,
      existingNotes.length + limit,
    );

    const hasMore = filteredNotes.length > 0;
    const paginatedNotes = filteredNotes.slice(0, limit);

    const pagintedNotesAuthorIds = paginatedNotes.map(note => note.authorId);

    // Make sure those authors are not explicit publications
    const explicitAuthors = await prismaArticles.publication.findMany({
      where: {
        authorId: {
          in: pagintedNotesAuthorIds,
        },
        explicit: true,
      },
      select: {
        authorId: true,
      },
    });

    const paginatedNonExplicitNotes = paginatedNotes.filter(
      note =>
        !explicitAuthors.some(
          author => author.authorId === BigInt(note.authorId || 0),
        ),
    );

    const attachments = await prismaArticles.notesAttachments.findMany({
      where: {
        noteId: {
          in: paginatedNonExplicitNotes.map(note => parseInt(note.commentId)),
        },
      },
    });

    const filteredNotesWithAttachments = paginatedNonExplicitNotes.map(note => {
      const attachment = attachments.find(
        attachment => attachment.noteId === parseInt(note.commentId),
      );
      return { ...note, attachment: attachment?.imageUrl };
    });

    const maxScore = filteredNotesWithAttachments.length;

    const notesResponse: InspirationNote[] = filteredNotesWithAttachments.map(
      (note, index) => ({
        id: note.commentId,
        content: note.body,
        createdAt: note.date,
        authorId: note.authorId,
        authorName: note.name || "",
        body: note.body,
        handle: note.handle || "",
        thumbnail: note.photoUrl || undefined,
        reactionCount: note.reactionCount,
        entityKey: note.entityKey,
        commentsCount: note.commentsCount || 0,
        restacks: note.restacks,
        attachment: note.attachment || undefined,
        score: maxScore - index,
      }),
    );

    return NextResponse.json({
      items: notesResponse,
      hasMore,
    });
  } catch (error: any) {
    loggerServer.error("Failed to fetch notes", {
      error,
      userId: session?.user.id,
    });
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 },
    );
  } finally {
    console.timeEnd("generate notes");
  }
}
