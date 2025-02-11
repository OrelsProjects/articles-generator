import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { Model, runPrompt } from "@/lib/openRouter";
import {
  generateIdeasPrompt,
  generateOutlinePrompt,
  IdeasLLMResponse,
  OutlineLLMResponse,
} from "@/lib/prompts";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { getUserArticlesWithBody } from "@/lib/dal/articles";
import { searchSimilarArticles } from "@/lib/dal/milvus";
import { ArticleWithBody } from "@/types/article";
import { parseJson } from "@/lib/utils/json";

export const maxDuration = 60; // This function can run for a maximum of 5 seconds

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

    const ideasGeneratedToday = await prisma.ideas.findMany({
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

    const topic = req.nextUrl.searchParams.get("topic");
    const ideasCount = req.nextUrl.searchParams.get("ideasCount");
    const shouldSearch = req.nextUrl.searchParams.get("shouldSearch");

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
    const userArticles = await getUserArticlesWithBody({
      publicationId: publicationMetadata.idInArticlesDb,
    });
    console.timeEnd("Getting user articles with order by reaction count");

    const modelUsedForIdeas = "anthropic/claude-3.5-sonnet";
    const modelUsedForOutline = "openai/gpt-4o";

    const inspirations: ArticleWithBody[] = (await searchSimilarArticles({
      query: topic || publicationMetadata.generatedDescription,
      limit: 10,
      includeBody: true,
    })) as ArticleWithBody[];

    const ideasUsed = await prisma.ideas.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        description: true,
      },
    });

    const messages = generateIdeasPrompt(publicationMetadata, userArticles, {
      topic,
      ideasCount: parseInt(ideasCount || "3"),
      ideasUsed: ideasUsed.map(idea => idea.description),
      shouldSearch: shouldSearch === "true",
    });

    const ideasString = await runPrompt(messages, modelUsedForIdeas);
    let { ideas } = await parseJson<IdeasLLMResponse>(ideasString);

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

    const outlinesString = await runPrompt(
      messagesForOutline,
      modelUsedForOutline,
    );
    const { outlines } = await parseJson<OutlineLLMResponse>(outlinesString);

    const ideasWithOutlines = ideas.map((idea, index) => ({
      ...idea,
      outline: outlines.find(outline => outline.id === index)?.outline,
      status: "new",
      modelUsedForIdeas,
      modelUsedForOutline,
    }));

    for (const idea of ideasWithOutlines) {
      const ideaCreated = await prisma.ideas.create({
        data: {
          topic,
          userId: session.user.id,
          title: idea.title,
          subtitle: idea.subtitle,
          description: idea.description,
          outline: idea.outline || "",
          inspiration: idea.inspiration,
          publicationId: publicationMetadata.id,
          status: "new",
          search: shouldSearch === "true",
          modelUsedForIdeas,
          modelUsedForOutline,
        },
      });

      idea.id = ideaCreated.id;
    }

    console.timeEnd("Start generating ideas");
    return NextResponse.json(ideasWithOutlines);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

`
"\n    You are Orel, a dynamic solopreneur and software developer who left a lucrative job to pursue the entrepreneurial dream. Passionate about building products, you enjoy the freedom to innovate and share your journey and insights through a weekly newsletter. You love reading, especially books that challenge and inspire you, and you frequently focus on harnessing this habit to drive personal growth and business acumen. You’re working on several projects, constantly testing product ideas, iterating on feedback, and maintaining a keen interest in entrepreneurship, productivity, and creating valuable educational content.\n\n    Your writing style is personable and motivational, often infused with personal anecdotes and lessons learned from failures and successes. You employ a direct, conversational tone, focusing on practical advice and actionable insights. You prefer being candid about your experiences, using humor and honesty to engage readers. You employ a structured approach to storytelling, often using bullet points and clear sections, with a penchant for summarizing key points to reinforce learning and engagement. Your articles are rich with technical details when needed, showcasing your depth of knowledge in software development.\n    \n    You are an expert content strategist and writer.\n    Your task is to generate 5 original article ideas for the user based on their publication description, topics they write about, and their writing style.\n    Additionally, consider the top 5 articles in the user's genre to ensure relevance and appeal.\n    The response must be structured in JSON format with the following details:\n\n    {\n      \"ideas\": [\n        {\n          \"title\": \"<Article Title>\",\n          \"subtitle\": \"<Article Subtitle>\",\n          \"description\": \"<Brief description of the article>\",\n          \"inspiration\": \"<Brief note on what inspired this idea, referencing relevant top articles or user topics>\"\n        }\n      ]\n    }\n\n    Guidelines for generating content:\n    - Ensure titles are compelling and relevant to the user's audience.\n    - Focus on originality while drawing subtle inspiration from popular content.\n    - Avoid generic topics; provide unique angles or fresh perspectives.\n    - Write in a human, natural voice that doesn't sound AI-generated.\n    - **Use the articles' titles and subtitles as templates for the ideas' titles and subtitles.\n        "
`;
