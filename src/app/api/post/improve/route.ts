import { prisma } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { runPrompt } from "@/lib/open-router";
import { generateImprovementPromptPost } from "@/lib/prompts";
import { canUseAI, undoUseCredits, useCredits } from "@/lib/utils/credits";
import { handleUsageError } from "@/lib/utils/ideas";
import loggerServer from "@/loggerServer";
import { AIUsageResponse } from "@/types/aiUsageResponse";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const MAX_CHARACTERS = 15000;
export const maxDuration = 300; // This function can run for a maximum of 5 minutes

export async function POST(
  request: NextRequest,
): Promise<NextResponse<AIUsageResponse<string>>> {
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
    const { text, type, ideaId, customText } = await request.json();

    const {result, status} = await canUseAI(session.user.id, "textEnhancement");
    if (!result) {
      return NextResponse.json(
        { success: false, error: "Not enough credits" },
        { status },
      );
    }

    const { creditsUsed, creditsRemaining } = await useCredits(
      session.user.id,
      "textEnhancement",
    );
    didConsumeCredits = true;

    const idea = await prisma.idea.findUnique({
      where: {
        id: ideaId,
      },
    });

    const slicedText = text.slice(0, MAX_CHARACTERS);

    const { messages, model } = generateImprovementPromptPost(
      slicedText,
      type,
      idea,
      {
        extras: customText,
        customText: customText,
      },
    );
    const response = await runPrompt(messages, model);

    return NextResponse.json({
      responseBody: {
        body: response || "",
        creditsUsed,
        creditsRemaining,
        type: "textEnhancement",
      },
    });
  } catch (error: any) {
    loggerServer.error("Error improving article:", {
      error,
      userId: session?.user.id,
    });
    if (didConsumeCredits) {
      await undoUseCredits(session.user.id, "textEnhancement");
    }
    const { message, status } = await handleUsageError(error, usageId);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
