import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { runPrompt } from "@/lib/openRouter";
import { generateIdeasPrompt, generateOutlinePrompt } from "@/lib/prompts";
import { Article } from "@/models/article";
import { Idea } from "@/models/idea";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const topic = req.nextUrl.searchParams.get("topic");
    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId: session.user.id,
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

    const inspirations = await axios.get<Article[]>(
      `http://localhost:3002/search?q=${topic || publicationMetadata.generatedDescription}&limit=10&includeBody=true`,
    );

    const userArticlesResponse = await axios.get<Article[]>(
      `http://localhost:3002/get-user-articles?substackUrl=${publicationMetadata.publicationUrl}&limit=60`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const messages = generateIdeasPrompt(
      publicationMetadata,
      inspirations.data,
      session.user.name || "",
    );

    const ideasString = await runPrompt(messages, "openai/gpt-4o");
    const { ideas }: { ideas: Omit<Idea, "outline">[] } =
      JSON.parse(ideasString);

    const messagesForOutline = generateOutlinePrompt(
      ideas.map((idea, index) => ({
        id: index,
        description: idea.description,
      })),
      publicationMetadata.generatedDescription,
      userArticlesResponse.data,
    );

    const outlinesString = await runPrompt(messagesForOutline, "openai/gpt-4o");
    const { outlines }: { outlines: { id: number; outline: string }[] } =
      JSON.parse(outlinesString);

    const ideasWithOutlines = ideas.map((idea, index) => ({
      ...idea,
      outline: outlines.find(outline => outline.id === index)?.outline,
    }));

    // write ideas to file
    fs.writeFileSync("ideas.json", JSON.stringify(ideasWithOutlines, null, 2));

    return NextResponse.json(ideasWithOutlines);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
