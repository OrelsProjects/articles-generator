import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { getUserPlan } from "@/lib/dal/user";
import { runPrompt } from "@/lib/open-router";
import { generateImprovementPrompt } from "@/lib/prompts";
import { canUseAI, useCredits } from "@/lib/utils/credits";
import { handleUsageError, useAIItem } from "@/lib/utils/ideas";
import loggerServer from "@/loggerServer";
import { AIUsageType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const MAX_CHARACTERS = 15000;
export const maxDuration = 300; // This function can run for a maximum of 5 minutes

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let usageId: string = "";

  try {
    const userPlan = await getUserPlan(session.user.id);

    const { text, type, ideaId } = await request.json();

    const isValid = await canUseAI(
      session.user.id,
      AIUsageType.improvementArticle,
    );
    if (!isValid) {
      return NextResponse.json(
        { error: "Not enough credits" },
        { status: 400 },
      );
    }

    const idea = await prisma.idea.findUnique({
      where: {
        id: ideaId,
      },
    });

    const slicedText = text.slice(0, MAX_CHARACTERS);

    const { messages, model } = generateImprovementPrompt(
      type,
      slicedText,
      idea,
    );
    const response = await runPrompt(messages, model);
    await useCredits(session.user.id, AIUsageType.improvementArticle);

    return NextResponse.json(response || "");
  } catch (error: any) {
    loggerServer.error("Error improving article:", error);

    const { message, status } = await handleUsageError(error, usageId);
    return NextResponse.json({ error: message }, { status });
  }
}
