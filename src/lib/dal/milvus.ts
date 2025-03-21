import { prismaArticles } from "@/app/api/_db/db";
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
  minMatch?: number;
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
  minMatch = 0,
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
        .filter((article: any) => article.distance >= minMatch)
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
      loggerServer.error("Error updating db:", error);
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
  minMatch = 0,
}: SearchOptions) {
  const MILVUS_API_KEY = process.env.MILVUS_API_KEY;
  const MILVUS_ENDPOINT = process.env.MILVUS_ENDPOINT;
  const COLLECTION_NAME = "notes_valid";
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
    limit: limit,
    outputFields: ["*"],
    filter: filtersString,
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

  const topMatchNotes = data.data
    ? data.data.filter((note: any) =>
        minMatch ? note.distance >= minMatch : true,
      )
    : [];
  //select random notes from topMatchNotes

  const notesFromDb = await prismaArticles.notesComments.findMany({
    where: {
      id: {
        in: topMatchNotes.map((note: any) => note.id),
      },
    },
  });

  const topNotes = notesFromDb.sort(() => Math.random() - 0.5).slice(0, limit);
  return topNotes.map(note => {
    const noteFromMilvus = topMatchNotes.find(
      (match: any) => match.id === note.id,
    );
    return {
      ...note,
      body: noteFromMilvus?.body || note.body,
      date: noteFromMilvus?.date ? new Date(noteFromMilvus.date * 1000)  : note.date,
    };
  });
}

export { searchSimilarArticles, searchSimilarNotes };
