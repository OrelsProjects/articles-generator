import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { Model, runPrompt } from "@/lib/openRouter";
import {
  generateIdeasPrompt,
  generateOutlinePrompt,
  IdeaLLM,
  IdeasLLMResponse,
  OutlineLLMResponse,
} from "@/lib/prompts";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { getUserArticles, getUserArticlesWithBody } from "@/lib/dal/articles";
import { searchSimilarArticles } from "@/lib/dal/milvus";
import { ArticleWithBody } from "@/types/article";
import { parseJson } from "@/lib/utils/json";
import loggerServer from "@/loggerServer";
import { cleanArticleBody } from "@/lib/utils/article";
import { PublicationMetadata } from "@prisma/client";
import { runWithRetry } from "@/lib/utils/requests";

export const maxDuration = 300; // This function can run for a maximum of 5 minutes

const modelUsedForIdeas: Model = "openai/gpt-4o";
const modelUsedForOutline: Model = "anthropic/claude-3.5-sonnet";

async function generateIdeas(
  userId: string,
  topic: string,
  publicationMetadata: PublicationMetadata,
  ideasCount: string,
  shouldSearch: string,
  cleanedUserArticles: ArticleWithBody[],
) {
  let ideas: IdeaLLM[] = [];

  const ideasWithoutOutlines = await prisma.idea.findMany({
    where: {
      userId,
      outline: "",
      topic,
    },
  });

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

export async function GET(req: NextRequest) {
  console.time("Start generating ideas");
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    console.time("Pre-query");
    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        publication: true,
      },
    });

    if (!userMetadata?.plan || userMetadata.plan === "free") {
      return NextResponse.json(
        { error: "User is not authorized to generate ideas" },
        { status: 403 },
      );
    }
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const ideasGeneratedToday = await prisma.idea.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startOfDay,
        },
      },
    });

    const maxIdeas = userMetadata.plan === "superPro" ? 40 : 20;
    if (ideasGeneratedToday.length >= maxIdeas) {
      return NextResponse.json(
        { error: "You have reached the maximum number of ideas for today" },
        { status: 429 },
      );
    }

    const topic = req.nextUrl.searchParams.get("topic") || "";
    const ideasCount = req.nextUrl.searchParams.get("ideasCount") || "3";
    const shouldSearch =
      req.nextUrl.searchParams.get("shouldSearch") || "false";

    const publicationMetadata = userMetadata?.publication;

    if (
      !publicationMetadata ||
      !publicationMetadata.generatedDescription ||
      !publicationMetadata.idInArticlesDb
    ) {
      return NextResponse.json(
        { error: "User was not initialized" },
        { status: 403 },
      );
    }

    console.timeEnd("Pre-query");

    console.time("Getting user articles with order by reaction count");
    const userArticles = await getUserArticlesWithBody(
      {
        publicationId: publicationMetadata.idInArticlesDb,
      },
      {
        limit: 8,
        freeOnly: true,
        order: { by: "reactionCount", direction: "desc" },
      },
    );

    const cleanedUserArticles = userArticles.map(article => ({
      ...article,
      bodyText: cleanArticleBody(article.bodyText),
    }));
    console.timeEnd("Getting user articles with order by reaction count");

    let ideas: IdeaLLM[] = await generateIdeas(
      session.user.id,
      topic,
      publicationMetadata,
      ideasCount,
      shouldSearch,
      cleanedUserArticles,
    );
    const messagesForOutline = generateOutlinePrompt(
      publicationMetadata,
      ideas.map((idea, index) => ({
        id: index,
        description: idea.description,
      })),
      publicationMetadata.generatedDescription,
      userArticles,
      shouldSearch === "true",
    );

    let outlines: { id: number; outline: string }[] = [];

    await runWithRetry(
      async () => {
        const outlinesString = await runPrompt(
          messagesForOutline,
          modelUsedForOutline,
        );

        const outlineResponse =
          await parseJson<OutlineLLMResponse>(outlinesString);
        outlines = outlineResponse.outlines;
      },
      {
        retries: 2,
        delayTime: 0,
      },
    );

    const ideasWithOutlines = ideas.map((idea, index) => {
      const outline = outlines.find(outline => outline.id === index)?.outline;
      return {
        ...idea,
        outline,
        body: outline,
        status: "new",
        modelUsedForIdeas,
        modelUsedForOutline,
      };
    });

    for (const idea of ideasWithOutlines) {
      const ideaCreated = await prisma.idea.update({
        where: {
          id: idea.id,
        },
        data: {
          topic,
          userId: session.user.id,
          title: idea.title,
          subtitle: idea.subtitle,
          description: idea.description,
          outline: idea.outline || "",
          body: idea.outline || "",
          inspiration: idea.inspiration,
          publicationId: publicationMetadata.id,
          status: "new",
          search: shouldSearch === "true",
          image: idea.image,
          modelUsedForIdeas,
          modelUsedForOutline,
        },
      });

      idea.id = ideaCreated.id;
    }

    console.timeEnd("Start generating ideas");
    return NextResponse.json(ideasWithOutlines);
  } catch (error: any) {
    loggerServer.error("Error generating ideas:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
