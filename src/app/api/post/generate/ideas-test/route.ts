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
import {
  useAIItem,
  generateIdeas,
  handleUsageError,
  setUserGeneratingIdeas,
} from "@/lib/utils/ideas";

export const maxDuration = 300; // This function can run for a maximum of 5 minutes

const modelUsedForIdeas: Model = "openai/gpt-4o";
// const modelUsedForIdeas: Model = "anthropic/claude-3.7-sonnet";
const modelUsedForOutline: Model = "anthropic/claude-3.7-sonnet";

const MAX_IDEAS_COUNT = 3;

export async function GET(req: NextRequest) {
  console.time("Start generating ideas");
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const top5Ideas = await prisma.idea.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(top5Ideas);
}
