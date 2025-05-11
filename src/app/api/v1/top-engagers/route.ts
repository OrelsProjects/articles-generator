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

const schema = z.object({
  authorId: z.string().or(z.number()).optional(),
  url: z.string().optional(),
});

const getExistingEngagers = async (authorId: string, minEngagers = 20) => {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const existingEngagers = await prisma.freeUserEngagers.findMany({
    where: {
      userAuthorId: authorId,
      updatedAt: {
        gt: twoDaysAgo,
      },
    },
  });

  if (existingEngagers.length > minEngagers) {
    return existingEngagers;
  }

  return null;
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const searchParams = request.nextUrl.searchParams;
  const userId = session?.user.id || "unknown";
  const isFree = !session?.user.meta?.plan;
  const limit = searchParams.get("limit") || "25";
  let url, authorId;
  try {
    const body = await request.json();
    const parsedBody = schema.safeParse(body);
    if (parsedBody.success) {
      url = parsedBody.data.url;
      authorId = parsedBody.data.authorId;
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

    let existingEngagers: FreeUserEngagers[] | null = null;
    if (authorId) {
      existingEngagers = await getExistingEngagers(authorId.toString());
    }

    if (existingEngagers) {
      return NextResponse.json(
        { success: true, result: session ? existingEngagers : undefined },
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

    if (authorId) {
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

      const publication = await prismaArticles?.publication.findMany({
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

      const posts = await prismaArticles?.post.findMany({
        where: {
          publicationId: publicationId?.toString(),
        },
        take: 10,
        orderBy: {
          postDate: "desc",
        },
      });

      if ((!posts || posts.length === 0) && url) {
        await scrapePosts(url, 0, parseInt(authorId.toString()), {
          stopIfNoNewPosts: true,
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
      const usersData = await getBylinesData(
        potentialUsers.map(user => user.id),
      );
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

      const sortedEngagers = engagersWithScore.sort(
        (a, b) => b.score - a.score,
      );

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
        0,
        isFree ? parseInt(limit) : parseInt(limit),
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
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch (error) {
    loggerServer.error("Error fetching top engagers:", {
      error,
      userId,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
