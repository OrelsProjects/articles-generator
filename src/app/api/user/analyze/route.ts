import prisma from "@/app/api/_db/db";
import { extractContent } from "@/app/api/user/analyze/_utils";
import { Article } from "@/models/article";
import { authOptions } from "@/auth/authOptions";
import { generateDescriptionPrompt } from "@/lib/prompts";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { runPrompt } from "@/lib/openRouter";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const { substackUrl } = await req.json();
  const userArticles = await axios.get<Article[]>(
    `http://localhost:3002/get-user-articles?substackUrl=${substackUrl}&limit=30`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  const userArticlesData = userArticles.data;
  const { image, title, description } = await extractContent(substackUrl);

  const messages = generateDescriptionPrompt(
    description,
    userArticlesData.map(article => ({
      title: article.search_engine_title || article.title || "",
      subtitle: article.search_engine_description || article.description || "",
    })),
  );

  const generatedDescription = await runPrompt(messages, "openai/gpt-4o");

  const descriptionObject: { about: string } = JSON.parse(generatedDescription);

  if (publicationMetadata) {
    await prisma.publicationMetadata.update({
      where: {
        id: publicationMetadata.id,
      },
      data: {
        generatedDescription: descriptionObject.about,
      },
    });
  } else {
    const publication = await prisma.publicationMetadata.create({
      data: {
        publicationUrl: substackUrl,
        image,
        title,
        description,
        generatedDescription: descriptionObject.about,
      },
    });
    await prisma.userMetadata.update({
      where: {
        userId: "67a0ba04b3ad91ede7091e2b",
      },
      data: {
        publication: { connect: { id: publication.id } },
      },
    });
  }
  return NextResponse.json(userArticlesData);
}
