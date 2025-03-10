import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { runPrompt } from "@/lib/open-router";
import { generateImprovementPrompt } from "@/lib/prompts";
import { canUseAI, useCredits } from "@/lib/utils/credits";
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

  try {
    const { text, type, ideaId } = await request.json();

    const isValid = await canUseAI(session.user.id, "textEnhancement");
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Not enough credits" },
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
    const { creditsUsed, creditsRemaining } = await useCredits(
      session.user.id,
      "textEnhancement",
    );

    return NextResponse.json({
      responseBody: {
        body: response || "",
        creditsUsed,
        creditsRemaining,
        type: "textEnhancement",
      },
    });
  } catch (error: any) {
    loggerServer.error("Error improving article:", error);

    const { message, status } = await handleUsageError(error, usageId);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
