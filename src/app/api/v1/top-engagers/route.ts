import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma, prismaArticles } from "@/lib/prisma";
import { getManyPotentialUsers } from "@/lib/dal/radar";
import { Engager } from "@/types/engager";
import {
  addScoreToEngagers,
  addScoreToPotentialUsers,
} from "@/lib/utils/statistics";
import { getBylinesData } from "@/lib/dal/byline";
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const isFree = !session?.user.meta?.plan;
  let authorId = session?.user.meta?.tempAuthorId;
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "20";
    const offset = searchParams.get("offset") || "0";

    const metadata = await prisma.userMetadata.findUnique({
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

    const authorIdFromPublication = metadata?.publication?.authorId;
    authorId = authorIdFromPublication?.toString() || authorId;

    if (!authorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authorIdFromPublication && metadata?.publication?.idInArticlesDb) {
      // Fetch notes and posts from db.
      const notes = await prismaArticles?.notesComments.findMany({
        where: {
          authorId: authorIdFromPublication,
        },
        take: 10,
        orderBy: {
          timestamp: "desc",
        },
      });

      const posts = await prismaArticles?.post.findMany({
        where: {
          id: metadata.publication.idInArticlesDb.toString(),
        },
        take: 10,
        orderBy: {
          postDate: "desc",
        },
      });

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

      const paginatedEngagers = sortedEngagers.slice(
        0,
        isFree ? 5 : parseInt(limit),
      );

      return NextResponse.json(paginatedEngagers, { status: 200 });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

