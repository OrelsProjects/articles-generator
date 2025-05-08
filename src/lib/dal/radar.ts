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
  const profiles: RadarPublicProfileResponse[] = [];
  const existingBylines = await prismaArticles.bylineData.findMany({
    where: {
      id: {
        in: potentialUsers.map(user => user.id),
      },
    },
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
    const profileResponse = await fetch(
      `https://substack.com/api/v1/user/${user.id}-${user.slug}/public_profile`,
    );

    if (!profileResponse.ok) {
      loggerServer.error("Error fetching profile", {
        userId: "system",
        error: profileResponse.statusText,
      });
      continue;
    }

    const profile = await profileResponse.json();
    const parsedProfile = RadarPublicProfileSchema.safeParse(profile);
    if (parsedProfile.success) {
      profiles.push(parsedProfile.data);
    }
  }

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
      loggerServer.error("Error upserting byline data", {
        userId: "system",
        error: error,
        bylineData: bylineData,
      });
    }
  }

  loggerServer.info("Saved bylines data", {
    userId: "system",
    count: bylinesData.length,
  });
};

export const getPotentialUsers = async (
  postId: string | number,
  options: {
    saveNewBylinesInDB: boolean;
    includeData: boolean;
  } = {
    saveNewBylinesInDB: true,
    includeData: false,
  },
): Promise<RadarPotentialUserResponse[]> => {
  const data = await fetchWithHeaders(
    `https://www.substack.com/api/v1/post/${postId}/reactors`,
    3,
    100,
  );
  const potentialUsersParsed = potentialUsersSchema.safeParse(data);
  if (!potentialUsersParsed.success) {
    loggerServer.error("Error parsing potential users", {
      userId: "system",
      error: potentialUsersParsed.error,
    });
    return [];
  }

  const potentialUsers = potentialUsersParsed.data;
  let potentialUsersWithData: RadarPotentialUserResponse[] = [];
  if (options.saveNewBylinesInDB) {
    savePotentialUsers(potentialUsers).catch(error => {
      loggerServer.error("Error saving potential users", {
        userId: "system",
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
    } catch (error) {
      loggerServer.error("Error getting bylines data", {
        userId: "system",
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
  options: {
    saveNewBylinesInDB: boolean;
    includeData: boolean;
  } = {
    saveNewBylinesInDB: true,
    includeData: false,
  },
): Promise<RadarPotentialUserResponse[]> => {
  let potentialUsers: RadarPotentialUserResponse[] = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < postIds.length; i += BATCH_SIZE) {
    const batch = postIds.slice(i, i + BATCH_SIZE);
    const usersInBatch = await Promise.all(
      batch.map(postId =>
        getPotentialUsers(postId, {
          saveNewBylinesInDB: false,
          includeData: options.includeData,
        }),
      ),
    );
    usersInBatch.forEach(users => potentialUsers.push(...users));
  }

  if (options.saveNewBylinesInDB) {
    savePotentialUsers(potentialUsers).catch(error => {
      loggerServer.error("Error saving potential users", {
        userId: "system",
        error: error,
      });
    });
  }
  return potentialUsers;
};
