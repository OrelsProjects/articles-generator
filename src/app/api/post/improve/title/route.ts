import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { getUserArticles } from "@/lib/dal/articles";
import { searchSimilarArticles } from "@/lib/dal/milvus";
import { getUserPlan } from "@/lib/dal/user";
import { runPrompt } from "@/lib/open-router";
import { generateTitleSubtitleImprovementPrompt as generateTitleImprovementPrompt } from "@/lib/prompts";
import { handleUsageError, useAIItem } from "@/lib/utils/ideas";
import { parseJson } from "@/lib/utils/json";
import loggerServer from "@/loggerServer";
import { ArticleWithBody } from "@/types/article";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300; // This function can run for a maximum of 5 minutes

const getRelatedArticles = async (query: string) => {
  return (await searchSimilarArticles({
    query,
    limit: 5,
    includeBody: false,
    filters: [
      {
        leftSideValue: "reaction_count",
        rightSideValue: "50",
        operator: ">",
      },
    ],
  })) as ArticleWithBody[];
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let usageId: string = "";

  try {
    const { menuType, improveType, ideaId, value } = await request.json();

    const idea = await prisma.idea.findUnique({
      where: {
        id: ideaId,
      },
    });

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }
    
    usageId = await useAIItem(session.user.id, "titleOrSubtitleRefinement");

    const relatedArticles = await getRelatedArticles(
      `title: ${idea?.title}\nsubtitle: ${idea?.subtitle}`,
    );

    const relatedArticlesTitles = relatedArticles.map(article => ({
      title: article.title || "",
      subtitle: article.subtitle || "",
    }));

    const userTopArticles = await getUserArticles(
      { userId: session.user.id },
      {
        limit: 15,
        order: {
          by: "reactionCount",
          direction: "desc",
        },
        freeOnly: false,
        select: ["title", "subtitle"],
      },
    );

    const { messages, model } = generateTitleImprovementPrompt(
      menuType,
      improveType,
      relatedArticlesTitles,
      idea,
      value,
      userTopArticles.map(article => ({
        title: article.title || "",
        subtitle: article.subtitle || "",
      })),
    );

    const response = await runPrompt(messages, model);
    const { title, subtitle } = await parseJson<{
      title: string;
      subtitle: string;
    }>(response);
    return NextResponse.json({ title, subtitle });
  } catch (error: any) {
    loggerServer.error("Error improving article:", error);

    const { message, status } = await handleUsageError(error, usageId);
    return NextResponse.json({ error: message }, { status });
  }
}
