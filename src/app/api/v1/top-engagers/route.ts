import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma, prismaArticles } from "@/lib/prisma";
import { getManyPotentialUsers } from "@/lib/dal/radar";
import { Engager } from "@/types/engager";
import { addScoreToEngagers } from "@/lib/utils/statistics";
import { getBylines, getBylinesData } from "@/lib/dal/byline";
import loggerServer from "@/loggerServer";
import { getUrlComponents } from "@/lib/utils/url";
import { z } from "zod";
import { FreeUserEngagers } from "@prisma/client";
import { fetchAllNoteComments } from "@/app/api/analyze-substack/utils";
import { scrapePosts } from "@/lib/utils/publication";
import { Post } from "../../../../../prisma/generated/articles";

export const maxDuration = 300; // This function can run for a maximum of 5 minutes

const schema = z.object({
  authorId: z.string().or(z.number()).optional(),
  url: z.string().optional(),
});

const MAX_FREE_ENGAGERS = 20;
const MAX_PAID_ENGAGERS = 60;

const getExistingEngagers = async (authorId: string, minEngagers = 20) => {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const existingEngagers = await prisma.freeUserEngagers.findMany({
    where: {
      userAuthorId: authorId,
      updatedAt: {
        gt: twoDaysAgo,
      },
    },
    take: minEngagers,
  });

  if (existingEngagers.length >= minEngagers) {
    return existingEngagers;
  }

  return null;
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const searchParams = request.nextUrl.searchParams;
  const userId = session?.user.id || "unknown";
  const isFree = !session?.user.meta?.plan;
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "25";

  const validLimit = isFree
    ? Math.min(parseInt(limit), MAX_FREE_ENGAGERS)
    : Math.min(parseInt(limit), MAX_PAID_ENGAGERS);
  const validPage = isFree ? 1 : parseInt(page);

  let url, authorId;
  let parsedBody: z.infer<typeof schema> | null = null;
  try {
    const textBody = await request.text();
    try {
      const body = JSON.parse(textBody);
      const parsed = schema.safeParse(body);
      if (parsed.success) {
        url = parsed.data.url;
        authorId = parsed.data.authorId;
        parsedBody = parsed.data;
      }
    } catch (error) {
      loggerServer.warn("Error parsing body in top-engagers  ", {
        error,
        body: textBody,
        userId,
      });
    }

    loggerServer.info("Fetching top engagers for authorId:", {
      authorId,
      userId,
    });

    let metadata: {
      publication: {
        authorId: number;
        idInArticlesDb: number | null;
      } | null;
    } | null = null;

    if (session) {
      metadata = await prisma.userMetadata.findUnique({
        where: {
          userId: session?.user.id,
        },
        select: {
          publication: {
            select: {
              authorId: true,
              idInArticlesDb: true,
            },
          },
        },
      });
    }
    const authorIdFromPublication = metadata?.publication?.authorId;

    authorId =
      authorIdFromPublication?.toString() ||
      session?.user.meta?.tempAuthorId ||
      authorId;

    if (session?.user.meta?.isAdmin && parsedBody?.authorId) {
      authorId = parsedBody.authorId.toString();
    }

    let existingEngagers: FreeUserEngagers[] | null = null;
    if (authorId) {
      existingEngagers = await getExistingEngagers(
        authorId.toString(),
        validLimit,
      );
    }

    if (existingEngagers) {
      const paginatedEngagers = existingEngagers.slice(
        (validPage - 1) * validLimit,
        validPage * validLimit,
      );
      return NextResponse.json(
        { success: true, result: session ? paginatedEngagers : undefined },
        { status: 200 },
      );
    }

    if (!authorId) {
      loggerServer.error("No authorId found", {
        userId,
        authorId,
        authorIdFromPublication,
        metadata,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch notes and posts from db.
    const notes = await prismaArticles?.notesComments.findMany({
      where: {
        authorId: parseInt(authorId.toString()),
      },
      take: 10,
      orderBy: {
        timestamp: "desc",
      },
    });

    const publication = await prismaArticles.publication.findMany({
      where: {
        authorId: parseInt(authorId.toString()),
      },
      select: {
        id: true,
        subdomain: true,
        customDomain: true,
      },
    });

    if (!notes || notes.length === 0) {
      await fetchAllNoteComments(parseInt(authorId.toString()));
    }

    const { mainComponentInUrl } = getUrlComponents(url || "");

    const publicationId = publication?.find(
      p =>
        p.subdomain?.includes(mainComponentInUrl) ||
        p.customDomain?.includes(mainComponentInUrl),
    )?.id;

    let posts: Post[] = [];

    if (publicationId) {
      posts = await prismaArticles.post.findMany({
        where: {
          publicationId: publicationId?.toString(),
        },
        take: 10,
        orderBy: {
          postDate: "desc",
        },
      });
    }

    if ((!posts || posts.length === 0) && url) {
      await scrapePosts(url, 10, parseInt(authorId.toString()), {
        stopIfNoNewPosts: true,
      });
      posts = await prismaArticles.post.findMany({
        where: {
          publicationId: publicationId?.toString(),
        },
        take: 10,
        orderBy: {
          postDate: "desc",
        },
      });
    }

    const potentialUsers = await getManyPotentialUsers(
      posts.map(post => post.id),
      notes.map(note => note.commentId),
      {
        saveNewBylinesInDB: false,
        includeData: true,
      },
    );
    const response: Engager[] = [];
    const usersData = await getBylinesData(potentialUsers.map(user => user.id));
    potentialUsers.forEach(user => {
      const userData = usersData.find(
        userData => userData.id === BigInt(user.id),
      );
      response.push({
        authorId: user.id.toString(),
        photoUrl: user.photo_url ?? "",
        name: user.name,
        handle: userData?.slug ?? "",
        subscriberCount: user.subscriberCount ?? 0,
        subscriberCountString: userData?.subscriberCountString ?? "",
      });
    });
    const uniqueEngagers = response.filter(
      (engager, index, self) =>
        index === self.findIndex(t => t.authorId === engager.authorId),
    );

    const engagersWithScore = addScoreToEngagers(uniqueEngagers);

    const sortedEngagers = engagersWithScore.sort((a, b) => b.score - a.score);

    const bylines = await getBylines(
      sortedEngagers.map(engager => parseInt(engager.authorId)),
    );

    sortedEngagers.forEach(engager => {
      const byline = bylines.find(
        byline => byline.id === parseInt(engager.authorId),
      );
      if (byline) {
        engager.handle = byline.handle || "";
      }
    });

    for (const engager of sortedEngagers) {
      await prisma.freeUserEngagers.upsert({
        where: {
          userAuthorId_authorId: {
            userAuthorId: authorId.toString(),
            authorId: engager.authorId,
          },
        },
        update: engager,
        create: {
          ...engager,
          userAuthorId: authorId.toString(),
        },
      });
    }

    const paginatedEngagers = sortedEngagers.slice(
      (validPage - 1) * validLimit,
      validPage * validLimit,
    );

    if (session) {
      return NextResponse.json(
        { success: true, result: paginatedEngagers },
        { status: 200 },
      );
    }
    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 },
    );
  } catch (error) {
    loggerServer.error("Error fetching top engagers:", {
      error,
      userId,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
