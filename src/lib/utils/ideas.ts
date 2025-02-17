import prisma from "@/app/api/_db/db";
import { getUserArticles } from "@/lib/dal/articles";
import { searchSimilarArticles } from "@/lib/dal/milvus";
import { Model, runPrompt } from "@/lib/openRouter";
import { IdeaLLM, generateIdeasPrompt, IdeasLLMResponse } from "@/lib/prompts";
import { parseJson } from "@/lib/utils/json";
import { runWithRetry } from "@/lib/utils/requests";
import { ArticleWithBody } from "@/types/article";
import { GenerateIdeasNoPlanError } from "@/types/errors/GenerateIdeasNoPlanError";
import { IdeasBeingGeneratedError } from "@/types/errors/IdeasBeingGeneratedError";
import { MaxIdeasPerDayError } from "@/types/errors/MaxIdeasPerDayError";
import { PublicationMetadata } from "@prisma/client";

export async function generateIdeas(
  userId: string,
  topic: string,
  publicationMetadata: PublicationMetadata,
  ideasCount: string,
  shouldSearch: string,
  cleanedUserArticles: ArticleWithBody[],
  models: {
    modelUsedForIdeas: Model;
    modelUsedForOutline: Model;
  },
) {
  let ideas: IdeaLLM[] = [];
  const { modelUsedForIdeas, modelUsedForOutline } = models;

  const ideasWithoutOutlines = await prisma.idea.findMany({
    where: {
      userId,
      outline: "",
      topic,
    },
  });

  // Sometimes ideas outline generation fails, so instead of running the LLM again, we'll use the ideas already generated
  if (ideasWithoutOutlines.length === 0) {
    const inspirations: ArticleWithBody[] = (await searchSimilarArticles({
      query: topic || publicationMetadata.generatedDescription || "",
      limit: 5,
      includeBody: true,
      filters: [
        {
          leftSideValue: "reaction_count",
          rightSideValue: "50",
          operator: ">",
        },
      ],
    })) as ArticleWithBody[];

    const ideasUsed = await prisma.idea.findMany({
      where: {
        userId,
      },
      select: {
        description: true,
        title: true,
        subtitle: true,
      },
    });

    const posts = await getUserArticles(
      {
        publicationId: Number(publicationMetadata.idInArticlesDb),
      },
      {
        limit: undefined,
        freeOnly: false,
      },
    );

    const allPostsUsed = posts
      .map(post => ({
        title: post.title || "",
        subtitle: post.subtitle || "",
        description: post.description || "",
      }))
      .concat(
        ideasUsed.map(idea => ({
          title: idea.title || "",
          subtitle: idea.subtitle || "",
          description: idea.description || "",
        })),
      );

    const messages = generateIdeasPrompt(
      publicationMetadata,
      cleanedUserArticles,
      {
        topic,
        inspirations,
        ideasCount: parseInt(ideasCount || "3"),
        ideasUsed: allPostsUsed,
        shouldSearch: shouldSearch === "true",
      },
    );

    await runWithRetry(
      async () => {
        const ideasString = await runPrompt(messages, modelUsedForIdeas);
        const ideasResponse = await parseJson<IdeasLLMResponse>(ideasString);
        ideas = ideasResponse.ideas;
      },
      {
        retries: 2,
        delayTime: 0,
      },
    );

    const now = new Date();

    // save ideas to avoid calling the LLM again
    await prisma.idea.createMany({
      data: ideas.map(idea => ({
        ...idea,
        userId,
        publicationId: publicationMetadata.id,
        outline: "",
        body: "",
        inspiration: idea.inspiration,
        image: idea.image,
        topic,
        status: "new",
        search: shouldSearch === "true",
        modelUsedForIdeas,
        modelUsedForOutline,
        createdAt: now,
        updatedAt: now,
      })),
    });

    const newIdeasIds = await prisma.idea.findMany({
      where: {
        userId,
        createdAt: now,
      },
      select: {
        id: true,
        title: true,
      },
    });

    ideas = ideas.map(idea => ({
      ...idea,
      id: newIdeasIds.find(newIdea => newIdea.title === idea.title)?.id,
    }));
  } else {
    ideas = ideasWithoutOutlines.map(idea => ({
      id: idea.id,
      title: idea.title,
      subtitle: idea.subtitle,
      description: idea.description,
      inspiration: idea.inspiration,
      image: idea.image || "",
    }));
  }
  return ideas;
}

export async function setUserGeneratingIdeas(
  userId: string,
  isGeneratingIdeas: boolean,
) {
  // If already generating, return false
  const railGuards = await prisma.railGuards.findUnique({
    where: {
      id: userId,
    },
    select: {
      isGeneratingIdeas: true,
      updatedAt: true,
    },
  });

  if (railGuards?.isGeneratingIdeas) {
    // If less than 3 minutes passed since last ideas generation, throw an error
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    if (railGuards.updatedAt && railGuards.updatedAt > threeMinutesAgo) {
      throw new IdeasBeingGeneratedError(
        "There are ideas being generated as we speak. Wait a moment and refresh :)",
      );
    }
  }

  await prisma.railGuards.upsert({
    where: {
      id: userId,
    },
    create: {
      id: userId,
      isGeneratingIdeas,
    },
    update: {
      isGeneratingIdeas,
    },
  });
}

/**
 * This function checks if the user can generate ideas and sets the user as generating ideas
 * @param userId
 * @throws {GenerateIdeasNoPlanError} if the user is not authorized to generate ideas
 * @throws {IdeasBeingGeneratedError} if the user is already generating ideas
 * @throws {MaxIdeasPerDayError} if the user has reached the maximum number of ideas per day
 */
export async function canUserGenerateIdeas(userId: string) {
  const userMetadata = await prisma.userMetadata.findUnique({
    where: {
      userId,
    },
    select: {
      plan: true,
    },
  });

  if (!userMetadata?.plan || userMetadata.plan === "free") {
    throw new GenerateIdeasNoPlanError();
  }

  await setUserGeneratingIdeas(userId, true);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const ideasGeneratedToday = await prisma.idea.findMany({
    where: {
      userId,
      createdAt: {
        gte: startOfDay,
      },
    },
  });

  const maxIdeas = userMetadata.plan === "superPro" ? 40 : 20;
  if (ideasGeneratedToday.length >= maxIdeas) {
    throw new MaxIdeasPerDayError(
      `You have reached the maximum number of ideas per day (${maxIdeas})`,
    );
  }
}
