import {
  RadarPotentialUserSchema,
  RadarPotentialUserResponse,
} from "@/types/radar.type";
import { z } from "zod";
import { BylineData } from "../../../prisma/generated/articles";
import loggerServer from "@/loggerServer";
import { fetchWithHeaders } from "@/lib/utils/requests";
import { getBylinesData } from "@/lib/dal/byline";

const potentialUsersSchema = z.array(RadarPotentialUserSchema);

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
  loggerServer.info(
    "[RADAR-POTENTIAL-USERS-ANALYSIS] Fetching potential users",
    {
      userId: "system",
      postId,
      type,
      options,
    },
  );

  const data = await fetchWithHeaders(
    `https://www.substack.com/api/v1/${type}/${postId}/reactors`,
    3,
    500,
  );
  const potentialUsersParsed = potentialUsersSchema.safeParse(data);
  if (!potentialUsersParsed.success) {
    loggerServer.error(
      "[RADAR-POTENTIAL-USERS-ANALYSIS] Error parsing potential users",
      {
        userId: "system",
        postId,
        type,
        error: potentialUsersParsed.error,
      },
    );
    return [];
  }

  const potentialUsers = potentialUsersParsed.data;
  loggerServer.info(
    "[RADAR-POTENTIAL-USERS-ANALYSIS] Successfully fetched potential users",
    {
      userId: "system",
      postId,
      type,
      count: potentialUsers.length,
    },
  );

  let potentialUsersWithData: RadarPotentialUserResponse[] = [];

  if (options.includeData) {
    potentialUsersWithData = [...potentialUsers];
    let bylinesData: BylineData[] = [];
    try {
      bylinesData = await getBylinesData(
        potentialUsersWithData.map(user => user.id),
      );
      loggerServer.info(
        "[RADAR-POTENTIAL-USERS-ANALYSIS] Successfully fetched bylines data",
        {
          userId: "system",
          postId,
          type,
          count: bylinesData.length,
        },
      );
    } catch (error) {
      loggerServer.error(
        "[RADAR-POTENTIAL-USERS-ANALYSIS] Error getting bylines data",
        {
          userId: "system",
          postId,
          type,
          error: error,
        },
      );
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
  loggerServer.info(
    "[RADAR-POTENTIAL-USERS-ANALYSIS] Starting batch fetch of potential users",
    {
      userId: "system",
      postCount: postIds.length,
      commentCount: commentsIds.length,
      options,
    },
  );

  let potentialUsers: RadarPotentialUserResponse[] = [];
  const BATCH_SIZE_COMMENTS = 3;
  const BATCH_SIZE_POSTS = 3;

  for (let i = 0; i < postIds.length; i += BATCH_SIZE_POSTS) {
    const batch = postIds.slice(i, i + BATCH_SIZE_POSTS);
    loggerServer.info(
      "[RADAR-POTENTIAL-USERS-ANALYSIS] Processing post batch",
      {
        userId: "system",
        batchIndex: i / BATCH_SIZE_POSTS,
        batchSize: batch.length,
      },
    );
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
    loggerServer.info(
      "[RADAR-POTENTIAL-USERS-ANALYSIS] Processing comment batch",
      {
        userId: "system",
        batchIndex: i / BATCH_SIZE_COMMENTS,
        batchSize: batch.length,
      },
    );
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
  return potentialUsers;
};
