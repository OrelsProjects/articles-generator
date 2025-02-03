import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { runPrompt } from "@/lib/openRouter";
import { generateIdeasPrompt } from "@/lib/prompts";
import { Article } from "@/models/article";
import { Idea } from "@/models/idea";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const substackUrl = req.nextUrl.searchParams.get("url");
    if (!substackUrl) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId: "67a0ba04b3ad91ede7091e2b",
      },
      include: {
        publication: true,
      },
    });

    const publicationMetadata = userMetadata?.publication;

    if (!publicationMetadata || !publicationMetadata.generatedDescription) {
      return NextResponse.json(
        { error: "User was not initialized" },
        { status: 403 },
      );
    }
    const userArticlesResponse = await axios.get<Article[]>(
      `http://localhost:3002/get-user-articles?substackUrl=${substackUrl}&limit=60`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    const messages = generateIdeasPrompt(
      publicationMetadata.generatedDescription,
      userArticlesResponse.data,
    );

    const ideasString = await runPrompt(
      messages,
      "anthropic/claude-3.5-sonnet",
    );
    const ideas: Idea[] = JSON.parse(ideasString);

    return NextResponse.json(ideas);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
