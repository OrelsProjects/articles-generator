import { prisma } from "@/lib/prisma";
import { getUserArticles } from "@/lib/dal/articles";
import { searchSimilarArticles } from "@/lib/dal/milvus";
import { Model, runPrompt } from "@/lib/open-router";
import { IdeaLLM, generateIdeasPrompt, IdeasLLMResponse } from "@/lib/prompts";
import { parseJson } from "@/lib/utils/json";
import { runWithRetry } from "@/lib/utils/requests";
import { ArticleWithBody } from "@/types/article";
import { GenerateIdeasNoPlanError } from "@/types/errors/GenerateIdeasNoPlanError";
import { IdeasBeingGeneratedError } from "@/types/errors/IdeasBeingGeneratedError";
import { MaxIdeasPerDayError } from "@/types/errors/MaxIdeasPerDayError";
import {
  AIUsageType,
  IdeaStatus,
  Plan,
  PublicationMetadata,
  UserMetadata,
} from "@prisma/client";
import { MaxRefinementsPerDayError } from "@/types/errors/MaxRefinementsPerDayError";
import { MaxEnhancementsPerDayError } from "@/types/errors/MaxEnhancementsPerDayError";
import loggerServer from "@/loggerServer";
import { UserNotFoundError } from "@/types/errors/UserNotFoundError";

export async function generateIdeas(
  userId: string,
  topic: string,
  publicationMetadata: PublicationMetadata,
  ideasCount: number,
  shouldSearch: string,
  cleanedUserArticles: ArticleWithBody[],
  models: {
    modelUsedForIdeas: Model;
    modelUsedForOutline: Model;
  },
  userMetadata: UserMetadata,
) {
  let ideas: IdeaLLM[] = [];
  const { modelUsedForIdeas, modelUsedForOutline } = models;

  const ideasWithoutOutlines = await prisma.idea.findMany({
    where: {
      userId,
      topic,
      status: IdeaStatus.noOutline,
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
        status: true,
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
      .slice(0, 20)
      .concat(
        ideasUsed
          .map(idea => ({
            title: idea.title || "",
            subtitle: idea.subtitle || "",
            description: idea.description || "",
          }))
          .slice(0, 10),
      );

    const ideasArchived = ideasUsed
      .filter(idea => idea.status === IdeaStatus.archived)
      .map(idea => ({
        title: idea.title || "",
        subtitle: idea.subtitle || "",
        description: idea.description || "",
      }))
      .slice(0, 30);

    const messages = generateIdeasPrompt(
      publicationMetadata,
      cleanedUserArticles,
      {
        topic,
        inspirations,
        ideasCount,
        ideasUsed: allPostsUsed,
        ideasArchived: ideasArchived.map(idea => ({
          title: idea.title || "",
          subtitle: idea.subtitle || "",
          description: idea.description || "",
        })),
        shouldSearch: shouldSearch === "true",
        language: userMetadata.preferredLanguage || undefined,
      },
    );

    await runWithRetry(
      async () => {
        const ideasString = await runPrompt(
          messages,
          modelUsedForIdeas,
          "G-IDEAS-" + userId,
        );
        const ideasResponse = await parseJson<IdeasLLMResponse>(ideasString);
        ideas = ideasResponse.ideas;
      },
      (error: string) => {
        loggerServer.error(
          "Error generating ideas for prompt: " + JSON.stringify(messages),
          {
            error,
            userId,
          },
        );
        throw new Error("Error generating ideas");
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
        status: IdeaStatus.noOutline,
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
      userId,
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
      userId,
    },
    create: {
      userId,
      isGeneratingIdeas,
    },
    update: {
      isGeneratingIdeas,
    },
  });
}

export async function handleUsageError(
  error: any,
  usageId: string,
): Promise<{
  message: string;
  status: number;
}> {
  loggerServer.error(`Handling usage error`, {
    error,
    usageId,
    userId: "usage",
  });

  if (error instanceof GenerateIdeasNoPlanError) {
    return {
      message: error.message,
      status: 403,
    };
  }

  if (error instanceof IdeasBeingGeneratedError) {
    return {
      message: error.message,
      status: 429,
    };
  }

  if (error instanceof MaxIdeasPerDayError) {
    return {
      message: error.message,
      status: 429,
    };
  }

  if (error instanceof MaxEnhancementsPerDayError) {
    return {
      message: error.message,
      status: 429,
    };
  }

  if (error instanceof MaxRefinementsPerDayError) {
    return {
      message: error.message,
      status: 429,
    };
  }

  if (error instanceof UserNotFoundError) {
    return {
      message: error.message,
      status: 404,
    };
  }

  if (!usageId) {
    loggerServer.error("BAD ERROR: Usage ID is undefined", {
      error,
      userId: "usage",
    });
  } else {
    // Remove usage, something went wrong on our side
    loggerServer.error("Removing usage due to an error", {
      usageId,
      userId: "usage",
    });
    await prisma.aiUsage.delete({
      where: {
        id: usageId,
      },
    });
  }
  return {
    message: "Internal server error",
    status: 500,
  };
}
