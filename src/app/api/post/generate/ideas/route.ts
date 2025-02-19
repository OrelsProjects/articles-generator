import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { Model, runPrompt } from "@/lib/open-router";
import {
  generateOutlinePrompt,
  IdeaLLM,
  OutlineLLMResponse,
} from "@/lib/prompts";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { getUserArticlesWithBody } from "@/lib/dal/articles";
import { parseJson } from "@/lib/utils/json";
import loggerServer from "@/loggerServer";
import { cleanArticleBody } from "@/lib/utils/article";
import { runWithRetry } from "@/lib/utils/requests";
import { useAIItem, generateIdeas, handleUsageError } from "@/lib/utils/ideas";

export const maxDuration = 300; // This function can run for a maximum of 5 minutes

const modelUsedForIdeas: Model = "openai/gpt-4o";
const modelUsedForOutline: Model = "anthropic/claude-3.5-sonnet";

const MAX_IDEAS_COUNT = 3;

export async function GET(req: NextRequest) {
  console.time("Start generating ideas");
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let usageId: string = "";

  try {
    console.time("Pre-query");
    usageId = await useAIItem(session.user.id, "ideaGeneration");

    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        publication: true,
      },
    });

    const topic = req.nextUrl.searchParams.get("topic") || "";
    const count = req.nextUrl.searchParams.get("count") || "1";
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
      MAX_IDEAS_COUNT,
      shouldSearch,
      cleanedUserArticles,
      {
        modelUsedForIdeas,
        modelUsedForOutline,
      },
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

    const { message, status } = await handleUsageError(error, usageId);
    return NextResponse.json({ error: message }, { status });
  } finally {
    console.timeEnd("Start generating ideas");
    await prisma.railGuards.update({
      where: {
        id: session.user.id,
      },
      data: {
        isGeneratingIdeas: false,
      },
    });
  }
}
