import prisma, { prismaArticles } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { getUserArticlesBody } from "@/lib/dal/articles";
import { getUserPlan } from "@/lib/dal/user";
import { runPrompt } from "@/lib/openRouter";
import { generateImprovementPrompt, ImprovementType } from "@/lib/prompts";
import { ArticleWithBody } from "@/types/article";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const MAX_CHARACTERS = 1500;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const userPlan = await getUserPlan(session.user.id);
    if (userPlan === "free") {
      return NextResponse.json(
        { error: "Free plan not allowed" },
        { status: 403 },
      );
    }

    const { text, type, ideaId } = await request.json();

    if (text.length > MAX_CHARACTERS) {
      return NextResponse.json(
        { error: "Text is too long (max " + MAX_CHARACTERS + " characters)" },
        { status: 400 },
      );
    }

    const idea = await prisma.idea.findUnique({
      where: {
        id: ideaId,
      },
    });

    const { messages, model } = generateImprovementPrompt(type, text, idea);
    const response = await runPrompt(messages, model);
    return NextResponse.json(response || "");
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
