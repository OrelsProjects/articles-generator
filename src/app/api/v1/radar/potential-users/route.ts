import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import loggerServer from "@/loggerServer";
import { canUseFeature } from "@/lib/plans-consts";
import { FeatureFlag } from "@prisma/client";
import { getPublicationPosts } from "@/lib/dal/publication/posts";
import { z } from "zod";
import { getManyPotentialUsers } from "@/lib/dal/radar";
import {
  RadarPotentialUser,
  radarPotentialUserResponseToClient,
} from "@/types/radar.type";
import { getBylines, getBylinesData } from "@/lib/dal/byline";
import { BylineWithExtras } from "@/types/article";
import { getAuthorNotes } from "@/lib/dal/publication/notes";
import { getPublicationByUrl } from "@/lib/dal/publication";
import { fetchAuthor } from "@/lib/utils/lambda";

const schema = z.object({
  url: z.string(),
  page: z.number().optional(),
  take: z.number().optional(),
  includeSelf: z.boolean().optional(),
});

const LIMIT = 5;
const LIMIT_TAKE = 30;

export const maxDuration = 600; // This function can run for a maximum of 10 minutes

const addScoreToPotentialUsers = (users: RadarPotentialUser[]) => {
  // count the amount of time each user appears in the list and order them by that.
  // Return list with unique users, mapping their id to the amount of times they appear in the list.
  const appearanceCount = users.reduce(
    (acc, user) => {
      acc[user.id] = (acc[user.id] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );
  return appearanceCount;
};

const getPotentialUsersScore = async (options: {
  url: string;
  publicationId: string;
  selfAuthorId?: number;
  publicationAuthorId?: number | bigint | null;
  page?: number;
  includeSelf?: boolean;
}) => {
  const {
    url,
    publicationId,
    selfAuthorId,
    publicationAuthorId,
    page,
    includeSelf,
  } = options;
  const publicationPosts = await getPublicationPosts({
    url,
    publicationId,
  });

  const publicationNotes = publicationAuthorId
    ? await getAuthorNotes(Number(publicationAuthorId), {
        take: 10,
        orderBy: "timestamp",
      })
    : [];
  const pageNumber = page || 0;

  const top5PostsByReactionCount = publicationPosts
    .sort((a, b) => (b.reactionCount || 0) - (a.reactionCount || 0))
    .slice(pageNumber * LIMIT, pageNumber * LIMIT + LIMIT);

  const potentialUsers = await getManyPotentialUsers(
    top5PostsByReactionCount.map(post => post.id),
    publicationNotes.map(note => note.commentId),
    {
      saveNewBylinesInDB: true,
      includeData: true,
    },
  );

  const response: RadarPotentialUser[] = potentialUsers.map(user =>
    radarPotentialUserResponseToClient(user),
  );

  const bylinesDb = await getBylines(response.map(user => user.id));
  const bylineDataDb = await getBylinesData(response.map(user => user.id));
  const orderedResponse = addScoreToPotentialUsers(response);

  const bylinesClient: BylineWithExtras[] = bylinesDb.map(byline => {
    const user = response.find(user => user.id === byline.id);
    const bylineData = bylineDataDb.find(
      bylineData => bylineData.id === BigInt(byline.id),
    );
    return {
      authorId: byline.id,
      handle: byline.handle || "",
      name: byline.name || "",
      photoUrl: byline.photoUrl || "",
      bio: byline.bio || "",
      isFollowing: user?.isFollowing || false,
      isSubscribed: user?.isSubscribed || false,
      bestsellerTier: user?.bestsellerTier || 0,
      subscriberCount: bylineData?.subscriberCountNumber
        ? Number(bylineData.subscriberCountNumber)
        : 0,
      subscriberCountString: bylineData?.subscriberCountString || "",
      score: orderedResponse[byline.id] || 0,
    };
  });

  let bylinesClientOrdered = bylinesClient.sort((a, b) => a.score - b.score);

  if (!includeSelf) {
    bylinesClientOrdered = bylinesClientOrdered.filter(
      user => user.authorId !== selfAuthorId,
    );
  }

  if (process.env.NODE_ENV === "production") {
    await fetchAuthor({
      authorId: publicationAuthorId?.toString(),
      publicationUrl: url,
      publicationId: publicationId,
    });
  }

  // upsert potential publication users
  const batchSize = 10;
  const batches = [];

  for (let i = 0; i < bylinesClientOrdered.length; i += batchSize) {
    batches.push(bylinesClientOrdered.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    for (const user of batch) {
      await Promise.allSettled([
        prisma.potentialPublicationUsers.upsert({
          where: {
            publicationIdInArticlesDb_bylineId: {
              publicationIdInArticlesDb: publicationId,
              bylineId: user.authorId,
            },
          },
          update: {
            score: user.score,
            isFollowing: user.isFollowing,
            isSubscribed: user.isSubscribed,
            bestsellerTier: user.bestsellerTier,
            subscriberCount: user.subscriberCount,
            subscriberCountString: user.subscriberCountString,
          },
          create: {
            publicationIdInArticlesDb: publicationId,
            bylineId: user.authorId,
            score: user.score,
            isFollowing: user.isFollowing,
            isSubscribed: user.isSubscribed,
            bestsellerTier: user.bestsellerTier,
            subscriberCount: user.subscriberCount,
            subscriberCountString: user.subscriberCountString,
          },
        }),
      ]);
    }
  }

  return bylinesClientOrdered;
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);
    const parsedBody = schema.safeParse(body);
    if (!parsedBody.success) {
      loggerServer.error("Invalid body in radar potential users", {
        userId: session.user.id,
        error: parsedBody.error,
        bodyText,
        body,
      });
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { url, page, includeSelf, take } = parsedBody.data;

    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        featureFlags: true,
        publication: {
          select: {
            authorId: true,
          },
        },
      },
    });

    if (!userMetadata) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const canUseRadar = canUseFeature(userMetadata, FeatureFlag.canUseRadar);

    if (!canUseRadar) {
      loggerServer.error("User does not have permission to use radar", {
        userId: session.user.id,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const publication = await getPublicationByUrl(url, {
      createIfNotFound: true,
    });

    const publicationId = publication[0]?.id.toString();
    const publicationAuthorId = publication[0]?.authorId;
    const selfAuthorId = userMetadata.publication?.authorId;

    const validTake = Math.min(take || LIMIT_TAKE, LIMIT_TAKE);
    const validPage = Math.max(page || 0, 0);

    const potentialPublicationUsers =
      await prisma.potentialPublicationUsers.findMany({
        where: {
          publicationIdInArticlesDb: publicationId,
        },
        orderBy: {
          score: "desc",
        },
        take: validTake,
        skip: validPage * LIMIT,
      });

    const bylines = await getBylines(
      potentialPublicationUsers.map(user => user.bylineId),
    );

    let bylinesClientOrdered: BylineWithExtras[] = bylines.map(byline => {
      const user = potentialPublicationUsers.find(
        user => user.bylineId === byline.id,
      );
      return {
        authorId: byline.id,
        handle: byline.handle || "",
        name: byline.name || "",
        photoUrl: byline.photoUrl || "",
        bio: byline.bio || "",
        isFollowing: user?.isFollowing || false,
        isSubscribed: user?.isSubscribed || false,
        bestsellerTier: user?.bestsellerTier || 0,
        subscriberCount: user?.subscriberCount || 0,
        subscriberCountString: user?.subscriberCountString || "",
        score: user?.score || 0,
      };
    });

    if (potentialPublicationUsers.length === 0) {
      bylinesClientOrdered = await getPotentialUsersScore({
        url,
        publicationId,
        selfAuthorId,
        publicationAuthorId,
        page,
        includeSelf,
      });
    }

    return NextResponse.json(bylinesClientOrdered, { status: 200 });
  } catch (error) {
    loggerServer.error("Error fetching potential users", {
      error: error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
