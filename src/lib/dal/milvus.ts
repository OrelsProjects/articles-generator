import { prismaArticles } from "@/lib/prisma";
import { getSubstackArticleData } from "@/lib/utils/article";
import loggerServer from "@/loggerServer";
import axios from "axios";

export type Filter = {
  leftSideValue: string;
  rightSideValue: string | number;
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "in" | "not in";
};

interface SearchOptions {
  query: string;
  limit?: number;
  includeBody?: boolean;
  filters?: Filter[];
  maxMatch?: number;
}

export interface ArticleContent {
  url: string;
  content: string;
  author?: {
    name: string;
    url: string | null;
  } | null;
}

function addRandomJitter(vector: number[], jitter?: number) {
  if (!jitter) {
    // Random between 0.01 and 0.04
    jitter = Math.random() * 0.03 + 0.01;
  }
  return vector.map(v => v + (Math.random() * 2 - 1) * jitter);
}

async function searchSimilarArticles({
  query,
  limit = 20,
  includeBody = false,
  filters = [],
  maxMatch = 0.65,
}: SearchOptions) {
  const MILVUS_API_KEY = process.env.MILVUS_API_KEY;
  const MILVUS_ENDPOINT = process.env.MILVUS_ENDPOINT;

  if (!MILVUS_API_KEY || !MILVUS_ENDPOINT) {
    throw new Error("Missing Milvus configuration");
  }

  const embedEndpoint = process.env.EMBED_LAMBDA_URL as string;

  // Generate embedding for the search query
  const embeddingResponse = await axios.post(embedEndpoint, {
    text: query,
  });

  const embedding = embeddingResponse.data.embedding;

  // Prepare Milvus API request
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${MILVUS_API_KEY}`,
    "Content-Type": "application/json",
  };

  const filtersString = filters
    .map(
      filter =>
        `${filter.leftSideValue} ${filter.operator} ${filter.rightSideValue}`,
    )
    .join(" AND ");

  const searchBody = {
    collectionName: "articles_substack",
    data: [embedding],
    limit: limit,
    outputFields: ["*"],
    filters: filtersString,
    searchParams: {
      anns_field: "vector",
      topk: limit,
      metric_type: "COSINE",
      params: { nprobe: 10 }, // ✅ FIXED ✅
      score_threshold: 0.3, // ✅ THRESHOLD WORKS NOW ✅
    },
  };

  // Search vectors in Milvus
  console.time("Search milvus");
  const response = await fetch(
    `${MILVUS_ENDPOINT}/v2/vectordb/entities/search`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify(searchBody),
    },
  );
  console.timeEnd("Search milvus");

  if (!response.ok) {
    throw new Error(`Milvus search failed: ${response.statusText}`);
  }

  const data = await response.json();
  const topArticles = data.data
    ? data.data
        .filter((article: any) => article.distance <= maxMatch)
        .slice(0, limit)
    : [];

  // Fetch articles from database
  console.time("Search db");
  const articles = await prismaArticles.post.findMany({
    where: {
      id: {
        in: topArticles.map((post: any) => post.id),
      },
    },
  });
  console.timeEnd("Search db");

  if (!includeBody) {
    return articles;
  }

  const articlesWithoutBody = articles.filter(article => !article.bodyText);

  if (articlesWithoutBody.length === 0) {
    return articles;
  }

  // If body content is requested, fetch it
  const urls = articlesWithoutBody.map(article => article.canonicalUrl || "");
  if (!urls) {
    return [];
  }
  const content = await getSubstackArticleData(urls);

  const updateDb = async () => {
    try {
      console.time("updateDb");
      const batch = 10;
      for (let i = 0; i < content.length; i += batch) {
        const batchContent = content.slice(i, i + batch);
        const promises = batchContent.map(async (item: any) => {
          const id = articles.find(
            article => article.canonicalUrl === item.url,
          )?.id;
          if (!id) {
            return;
          }
          return prismaArticles.post.update({
            where: {
              id: id,
            },
            data: {
              bodyText: item.content,
            },
          });
        });
        await Promise.all(promises);
      }
    } catch (error: any) {
      loggerServer.error("Error updating db:", {
        error,
        userId: "milvus",
      });
    } finally {
      console.timeEnd("updateDb");
    }
  };

  updateDb();

  const articlesWithBody = articles.map(article => ({
    ...article,
    body_text: content.find(item => item.url === article.canonicalUrl)?.content,
  }));

  return articlesWithBody;
}

async function searchSimilarNotes({
  query,
  limit = 100,
  filters = [],
  maxMatch = 0.65,
}: SearchOptions) {
  const MILVUS_API_KEY = process.env.MILVUS_API_KEY;
  const MILVUS_ENDPOINT = process.env.MILVUS_ENDPOINT;
  const COLLECTION_NAME = "notes";
  if (!MILVUS_API_KEY || !MILVUS_ENDPOINT) {
    throw new Error("Missing Milvus configuration");
  }

  const embedEndpoint = process.env.EMBED_LAMBDA_URL as string;

  // Generate embedding for the search query
  const embeddingResponse = await axios.post(embedEndpoint, {
    text: query,
  });

  let embedding = embeddingResponse.data.embedding;
  embedding = addRandomJitter(embedding);

  // Prepare Milvus API request
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${MILVUS_API_KEY}`,
    "Content-Type": "application/json",
  };

  const filtersString = filters
    .map(
      filter =>
        `${filter.leftSideValue} ${filter.operator} ${filter.rightSideValue}`,
    )
    .join(" AND ");

  const searchBody = {
    collectionName: COLLECTION_NAME,
    data: [embedding],
    // limit: limit,
    outputFields: ["*"],
    filter: filtersString,
    searchParams: {
      anns_field: "vector",
      topk: limit,
      metric_type: "COSINE",
      params: { nprobe: 50 }, // ✅ FIXED ✅
      score_threshold: 0.1,
    },
  };

  // Search vectors in Milvus
  console.time("Search milvus");
  const response = await fetch(
    `${MILVUS_ENDPOINT}/v2/vectordb/entities/search`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify(searchBody),
    },
  );
  console.timeEnd("Search milvus");

  // Check if content type is application/json
  if (
    !response.ok ||
    response.headers.get("content-type") !== "application/json"
  ) {
    throw new Error(`Milvus search failed: ${response.statusText}`);
  }

  const data = await response.json();

  const sortedTopMatchNotes = data.data.sort(
    (a: any, b: any) => a.distance - b.distance,
  );

  const notesFromDb = await prismaArticles.notesComments.findMany({
    where: {
      id: {
        in: sortedTopMatchNotes.map((note: any) => note.id),
      },
    },
  });

  // Sort the notes from db by distance. Find their corresponding distance in sortedTopMatchNotes
  const sortedTopMatchNotesFromDb = notesFromDb.sort((a: any, b: any) => {
    const distanceA = sortedTopMatchNotes.find(
      (note: any) => note.id === a.id,
    )?.distance;
    const distanceB = sortedTopMatchNotes.find(
      (note: any) => note.id === b.id,
    )?.distance;
    return distanceA - distanceB;
  });

  const topNotes = sortedTopMatchNotesFromDb.slice(0, limit * 2);
  // .sort(() => Math.random() - 0.5);
  return topNotes.map(note => ({
    ...note,
    body: note.body,
    date: note.date,
  }));
}

export { searchSimilarArticles, searchSimilarNotes };
