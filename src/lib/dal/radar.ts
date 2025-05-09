import {
  RadarPrimaryPublicationResponse,
  RadarPotentialUserSchema,
  RadarPublicProfileResponse,
  RadarPublicProfileSchema,
  RadarPotentialUserResponse,
} from "@/types/radar.type";
import { z } from "zod";
import slugify from "slugify";
import { BylineData } from "../../../prisma/generated/articles";
import { prismaArticles } from "@/lib/prisma";
import loggerServer from "@/loggerServer";
import { fetchWithHeaders } from "@/lib/utils/requests";
import { getBylinesData } from "@/lib/dal/byline";

const ONE_HOUR = 1000 * 60 * 60;
const TIME_TO_UPDATE_BYLINE_DATA = ONE_HOUR * 24; // 24 hours

// A B C -> a-b-c. A B C DEFG.COM -> a-b-c-defgcom
const nameToSlug = (name: string) => {
  return slugify(name, { lower: true, strict: true });
};

const potentialUsersSchema = z.array(RadarPotentialUserSchema);

export const savePotentialUsers = async (
  potentialUsers: RadarPotentialUserResponse[],
) => {
  loggerServer.info("[RADAR-POTENTIAL-USERS-ANALYSIS] Starting to save potential users", {
    userId: "system",
    count: potentialUsers.length,
  });

  const profiles: RadarPublicProfileResponse[] = [];
  const existingBylines = await prismaArticles.bylineData.findMany({
    where: {
      id: {
        in: potentialUsers.map(user => user.id),
      },
    },
  });

  loggerServer.info("[RADAR-POTENTIAL-USERS-ANALYSIS] Found existing bylines", {
    userId: "system",
    count: existingBylines.length,
  });

  // Only update bylines that haven't been updated in the last 24 hours
  const bylinesToUpdate = existingBylines.filter(byline => {
    return (
      byline.updatedAt &&
      byline.updatedAt < new Date(Date.now() - TIME_TO_UPDATE_BYLINE_DATA)
    );
  });

  const bylinesToCreate = potentialUsers.filter(user => {
    return !existingBylines.find(byline => byline.id === BigInt(user.id));
  });

  loggerServer.info("[RADAR-POTENTIAL-USERS-ANALYSIS] Filtered bylines for update and creation", {
    userId: "system",
    toUpdate: bylinesToUpdate.length,
    toCreate: bylinesToCreate.length,
  });

  const bylinesToUpsert: { id: bigint; slug: string }[] = [
    ...bylinesToUpdate.map(byline => ({
      id: byline.id,
      slug: byline.slug,
    })),
    ...bylinesToCreate.map(user => ({
      id: BigInt(user.id),
      slug: nameToSlug(user.name),
    })),
  ];

  for (const user of bylinesToUpsert) {
    const profileResponse = await fetchWithHeaders(
      `https://substack.com/api/v1/user/${user.id}-${user.slug}/public_profile`,
    );

    if (!profileResponse.ok) {
      loggerServer.error("[RADAR-POTENTIAL-USERS-ANALYSIS] Error fetching profile", {
        userId: "system",
        targetUserId: user.id.toString(),
        error: profileResponse.statusText,
      });
      continue;
    }

    const profile = await profileResponse.json();
    const parsedProfile = RadarPublicProfileSchema.safeParse(profile);
    if (parsedProfile.success) {
      profiles.push(parsedProfile.data);
    } else {
      loggerServer.error("[RADAR-POTENTIAL-USERS-ANALYSIS] Error parsing profile", {
        userId: "system",
        targetUserId: user.id.toString(),
        error: parsedProfile.error,
      });
    }
  }

  loggerServer.info("[RADAR-POTENTIAL-USERS-ANALYSIS] Successfully fetched profiles", {
    userId: "system",
    count: profiles.length,
  });

  const bylinesData: BylineData[] = profiles.map(profile => {
    return {
      id: BigInt(profile.id),
      slug: profile.slug,
      subscriberCount:
        profile.subscriberCount != null
          ? Number(profile.subscriberCount)
          : null,
      subscriberCountNumber: profile.subscriberCountNumber ?? null,
      subscriberCountString: profile.subscriberCountString ?? null,
      bestsellerTier: profile.bestseller_tier ?? null,
      photoUrl: profile.photo_url,
      profileSetUpAt: profile.profile_set_up_at ?? null,
      roughNumFreeSubscribers:
        profile.rough_num_free_subscribers != null
          ? Number(profile.rough_num_free_subscribers)
          : null,
      roughNumFreeSubscribersInt:
        profile.rough_num_free_subscribers_int ?? null,
      updatedAt: new Date(),
    };
  });

  for (const bylineData of bylinesData) {
    try {
      await prismaArticles.bylineData.upsert({
        where: { id: bylineData.id },
        update: bylineData,
        create: bylineData,
      });
    } catch (error) {
      loggerServer.error("[RADAR-POTENTIAL-USERS-ANALYSIS] Error upserting byline data", {
        userId: "system",
        targetUserId: bylineData.id.toString(),
        error: error,
        bylineData: bylineData,
      });
    }
  }

  loggerServer.info("[RADAR-POTENTIAL-USERS-ANALYSIS] Completed saving bylines data", {
    userId: "system",
    count: bylinesData.length,
  });
};

export const getPotentialUsers = async (
  postId: string | number,
  type: "post" | "comment",
  options: {
    saveNewBylinesInDB: boolean;
    includeData: boolean;
  } = {
    saveNewBylinesInDB: true,
    includeData: false,
  },
): Promise<RadarPotentialUserResponse[]> => {
  loggerServer.info("[RADAR-POTENTIAL-USERS-ANALYSIS] Fetching potential users", {
    userId: "system",
    postId,
    type,
    options,
  });

  const data = await fetchWithHeaders(
    `https://www.substack.com/api/v1/${type}/${postId}/reactors`,
    3,
    500,
  );
  const potentialUsersParsed = potentialUsersSchema.safeParse(data);
  if (!potentialUsersParsed.success) {
    loggerServer.error("[RADAR-POTENTIAL-USERS-ANALYSIS] Error parsing potential users", {
      userId: "system",
      postId,
      type,
      error: potentialUsersParsed.error,
    });
    return [];
  }

  const potentialUsers = potentialUsersParsed.data;
  loggerServer.info("[RADAR-POTENTIAL-USERS-ANALYSIS] Successfully fetched potential users", {
    userId: "system",
    postId,
    type,
    count: potentialUsers.length,
  });

  let potentialUsersWithData: RadarPotentialUserResponse[] = [];
  if (options.saveNewBylinesInDB) {
    savePotentialUsers(potentialUsers).catch(error => {
      loggerServer.error("[RADAR-POTENTIAL-USERS-ANALYSIS] Error saving potential users", {
        userId: "system",
        postId,
        type,
        error: error,
      });
    });
  }

  if (options.includeData) {
    potentialUsersWithData = [...potentialUsers];
    let bylinesData: BylineData[] = [];
    try {
      bylinesData = await getBylinesData(
        potentialUsersWithData.map(user => user.id),
      );
      loggerServer.info("[RADAR-POTENTIAL-USERS-ANALYSIS] Successfully fetched bylines data", {
        userId: "system",
        postId,
        type,
        count: bylinesData.length,
      });
    } catch (error) {
      loggerServer.error("[RADAR-POTENTIAL-USERS-ANALYSIS] Error getting bylines data", {
        userId: "system",
        postId,
        type,
        error: error,
      });
    }

    for (const user of potentialUsersWithData) {
      const bylineData = bylinesData.find(
        data => parseInt(data.id.toString()) === parseInt(user.id.toString()),
      );
      if (bylineData) {
        user.subscriberCount = bylineData.subscriberCount ?? undefined;
      }
    }
  }

  return potentialUsers;
};

export const getManyPotentialUsers = async (
  postIds: string[],
  commentsIds: string[],
  options: {
    saveNewBylinesInDB: boolean;
    includeData: boolean;
  } = {
    saveNewBylinesInDB: true,
    includeData: false,
  },
): Promise<RadarPotentialUserResponse[]> => {
  loggerServer.info("[RADAR-POTENTIAL-USERS-ANALYSIS] Starting batch fetch of potential users", {
    userId: "system",
    postCount: postIds.length,
    commentCount: commentsIds.length,
    options,
  });

  let potentialUsers: RadarPotentialUserResponse[] = [];
  const BATCH_SIZE_COMMENTS = 3;
  const BATCH_SIZE_POSTS = 3;

  for (let i = 0; i < postIds.length; i += BATCH_SIZE_POSTS) {
    const batch = postIds.slice(i, i + BATCH_SIZE_POSTS);
    loggerServer.info("[RADAR-POTENTIAL-USERS-ANALYSIS] Processing post batch", {
      userId: "system",
      batchIndex: i / BATCH_SIZE_POSTS,
      batchSize: batch.length,
    });
    const usersInBatch = await Promise.all(
      batch.map(postId =>
        getPotentialUsers(postId, "post", {
          saveNewBylinesInDB: false,
          includeData: options.includeData,
        }),
      ),
    );
    usersInBatch.forEach(users => potentialUsers.push(...users));
  }

  for (let i = 0; i < commentsIds.length; i += BATCH_SIZE_COMMENTS) {
    const batch = commentsIds.slice(i, i + BATCH_SIZE_COMMENTS);
    loggerServer.info("[RADAR-POTENTIAL-USERS-ANALYSIS] Processing comment batch", {
      userId: "system",
      batchIndex: i / BATCH_SIZE_COMMENTS,
      batchSize: batch.length,
    });
    const usersInBatch = await Promise.all(
      batch.map(commentId =>
        getPotentialUsers(commentId, "comment", {
          saveNewBylinesInDB: false,
          includeData: options.includeData,
        }),
      ),
    );
    usersInBatch.forEach(users => potentialUsers.push(...users));
  }

  loggerServer.info("[RADAR-POTENTIAL-USERS-ANALYSIS] Completed batch fetch", {
    userId: "system",
    totalUsersFound: potentialUsers.length,
  });

  if (options.saveNewBylinesInDB) {
    savePotentialUsers(potentialUsers).catch(error => {
      loggerServer.error("[RADAR-POTENTIAL-USERS-ANALYSIS] Error saving potential users from batch", {
        userId: "system",
        error: error,
      });
    });
  }
  return potentialUsers;
};
