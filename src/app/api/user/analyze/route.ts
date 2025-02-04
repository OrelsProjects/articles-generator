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
  try {
    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        publication: true,
      },
    });

    const publicationMetadata = userMetadata?.publication;

    const { url } = await req.json();
    const userArticles = await axios.get<Article[]>(
      `http://localhost:3002/get-user-articles?substackUrl=${url}&limit=15&includeBody=true`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    const userArticlesData = userArticles.data;
    const { image, title, description } = await extractContent(url);

    // TODO limit by wordcount, so you dont have too many articles and the api request doesnt fail
    const messages = generateDescriptionPrompt(description, userArticlesData);

    const generatedDescription = await runPrompt(messages, "openai/gpt-4o");

    const descriptionObject: {
      about: string;
      writingStyle: string;
      topics: string;
    } = JSON.parse(generatedDescription);

    let publicationId: string | null = publicationMetadata?.id || null;

    if (publicationMetadata) {
      await prisma.publicationMetadata.update({
        where: {
          id: publicationMetadata.id,
        },
        data: {
          generatedDescription: descriptionObject.about,
          writingStyle: descriptionObject.writingStyle,
          topics: descriptionObject.topics,
        },
      });
    } else {
      const publication = await prisma.publicationMetadata.create({
        data: {
          publicationUrl: url,
          image,
          title,
          description,
          generatedDescription: descriptionObject.about,
          writingStyle: descriptionObject.writingStyle,
          topics: descriptionObject.topics,
        },
      });
      await prisma.userMetadata.update({
        where: {
          userId: session.user.id,
        },
        data: {
          publication: { connect: { id: publication.id } },
        },
      });
      publicationId = publication.id;
    }
    return NextResponse.json({ publicationId });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

