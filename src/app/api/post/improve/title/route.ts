import { prisma } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { getUserArticles } from "@/lib/dal/articles";
import { searchSimilarArticles } from "@/lib/dal/milvus";
import { runPrompt } from "@/lib/open-router";
import { generateTitleSubtitleImprovementPrompt as generateTitleImprovementPrompt } from "@/lib/prompts";
import { canUseAI, undoUseCredits, useCredits } from "@/lib/utils/credits";
import { handleUsageError } from "@/lib/utils/ideas";
import { parseJson } from "@/lib/utils/json";
import loggerServer from "@/loggerServer";
import { AIUsageResponse } from "@/types/aiUsageResponse";
import { ArticleWithBody } from "@/types/article";
import { AIUsageType } from "@prisma/client";
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

export async function POST(
  request: NextRequest,
): Promise<NextResponse<AIUsageResponse<{ title: string; subtitle: string }>>> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let usageId: string = "";
  let didConsumeCredits = false;

  try {
    const { menuType, improveType, ideaId, value } = await request.json();

    const idea = await prisma.idea.findUnique({
      where: {
        id: ideaId,
      },
    });

    if (!idea) {
      return NextResponse.json(
        { success: false, error: "Idea not found" },
        { status: 404 },
      );
    }

    const { result, status } = await canUseAI(
      session.user.id,
      "titleOrSubtitleRefinement",
    );
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: "Not enough credits" },
        { status },
      );
    }

    const { creditsUsed, creditsRemaining } = await useCredits(
      session.user.id,
      "titleOrSubtitleRefinement",
    );
    didConsumeCredits = true;
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

    const promptResponse = await runPrompt(messages, model);
    const { title, subtitle } = await parseJson<{
      title: string;
      subtitle: string;
    }>(promptResponse);

    const response: AIUsageResponse<{ title: string; subtitle: string }> = {
      responseBody: {
        body: { title, subtitle },
        creditsUsed,
        creditsRemaining,
        type: "titleOrSubtitleRefinement",
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    loggerServer.error("Error improving article:", error);
    if (didConsumeCredits) {
      await undoUseCredits(session.user.id, "titleOrSubtitleRefinement");
    }
    const { message, status } = await handleUsageError(error, usageId);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
