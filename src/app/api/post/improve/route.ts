import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { getUserPlan } from "@/lib/dal/user";
import { runPrompt } from "@/lib/open-router";
import { generateImprovementPrompt } from "@/lib/prompts";
import { handleUsageError, useAIItem } from "@/lib/utils/ideas";
import loggerServer from "@/loggerServer";
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

    if (text.length > MAX_CHARACTERS) {
      return NextResponse.json(
        { error: "Text is too long (max " + MAX_CHARACTERS + " characters)" },
        { status: 400 },
      );
    }

    usageId = await useAIItem(session.user.id, "textEnhancement", userPlan);

    const idea = await prisma.idea.findUnique({
      where: {
        id: ideaId,
      },
    });

    const { messages, model } = generateImprovementPrompt(type, text, idea);
    const response = await runPrompt(messages, model);
    return NextResponse.json(response || "");
  } catch (error: any) {
    loggerServer.error("Error improving article:", error);

    const { message, status } = await handleUsageError(error, usageId);
    return NextResponse.json({ error: message }, { status });
  }
}
