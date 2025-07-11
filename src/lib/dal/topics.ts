import { prisma } from "@/lib/prisma";
import { PublicationTopics } from "@prisma/client";

const topicsStringToArray = (topics: string | string[]) => {
  let topicsArray = [];
  if (typeof topics === "string") {
    topicsArray = topics.split(",").map(topic => topic.trim());
  } else {
    topicsArray = topics;
  }
  return topicsArray.filter(topic => topic !== "");
};

/**
 * Add topics to the database.
 * If topic already exists, the count will be incremented.
 * If topic does not exist, it will be created.
 * @param topics - The topics to add. If string, has to be comma separated list of topics.
 * @returns The added topics
 */
export async function addTopicsString(topics: string | string[]) {
  const topicsArray = topicsStringToArray(topics);

  const existingTopics = await prisma.publicationTopics.findMany({
    where: {
      topic: {
        in: topicsArray,
      },
    },
  });

  const newTopics = topicsArray.filter(
    topic => !existingTopics.some(t => t.topic === topic),
  );

  if (newTopics.length > 0) {
    await prisma.publicationTopics.createMany({
      data: newTopics.map(topic => ({ topic })),
    });
  }

  if (existingTopics.length > 0) {
    await prisma.publicationTopics.updateMany({
      where: {
        topic: { in: existingTopics.map(t => t.topic) },
      },
      data: { count: { increment: 1 } },
    });
  }
}

export async function addTopics(
  topics: Pick<PublicationTopics, "topic" | "count">[],
) {
  const batchSize = 50;
  const batches = [];
  for (let i = 0; i < topics.length; i += batchSize) {
    batches.push(topics.slice(i, i + batchSize));
  }
  let promises = [];
  for (const batch of batches) {
    for (const topic of batch) {
      promises.push(
        prisma.publicationTopics.upsert({
          where: { topic: topic.topic },
          update: { count: { increment: topic.count } },
          create: topic,
        }),
      );
    }
    await Promise.all(promises);
  }
}

/**
 * Get popular topics
 * @param options - The options for the query
 * @param options.limit - The number of topics to return
 * @returns The popular topics
 */
export const getPopularTopics = async (options: { limit: number }) => {
  const topics = await prisma.publicationTopics.findMany({
    orderBy: { count: "desc" },
    take: options.limit,
  });

  return topics;
};

export const searchTopics = async (options: {
  limit: number;
  query: string;
}) => {
  const topics = await prisma.publicationTopics.findMany({
    where: {
      topic: { contains: options.query, mode: "insensitive" },
    },
    orderBy: { count: "desc" },
    take: options.limit,
  });

  return topics.map(topic => topic.topic);
};
