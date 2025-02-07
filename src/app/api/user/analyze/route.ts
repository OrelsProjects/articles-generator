import prisma from "@/app/api/_db/db";
import { extractContent } from "@/app/api/user/analyze/_utils";
import { Article } from "@/models/article";
import { authOptions } from "@/auth/authOptions";
import { generateDescriptionPrompt } from "@/lib/prompts";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { runPrompt } from "@/lib/openRouter";
import { Publication } from "@/models/publication";
import { getPublicationByUrl } from "@/lib/dal/publication";
import { getUserArticlesWithBody } from "@/lib/dal/articles";

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

    let publicationMetadata = userMetadata?.publication;

    const { url } = await req.json();

    const publications = await getPublicationByUrl(url);
    const userPublication = publications[0];

    const userArticles = userPublication
      ? await getUserArticlesWithBody({ publicationId: userPublication.id }, 10)
      : await getUserArticlesWithBody({ url }, 10);

    const { image, title, description } = await extractContent(url);
    const top10Articles = userArticles
      .sort((a, b) => (b.reactionCount || 0) - (a.reactionCount || 0))
      .slice(0, 10);
    // TODO limit by wordcount, so you dont have too many articles and the api request doesnt fail
    const messages = generateDescriptionPrompt(description, top10Articles);

    const generatedDescription = await runPrompt(messages, "openai/gpt-4o");

    const descriptionObject: {
      about: string;
      writingStyle: string;
      topics: string;
    } = JSON.parse(generatedDescription);

    if (publicationMetadata) {
      await prisma.publicationMetadata.update({
        where: {
          id: publicationMetadata.id,
        },
        data: {
          generatedDescription: descriptionObject.about,
          writingStyle: descriptionObject.writingStyle,
          topics: descriptionObject.topics,
          idInArticlesDb: userPublication?.id,
        },
      });
    } else {
      publicationMetadata = await prisma.publicationMetadata.create({
        data: {
          publicationUrl: url,
          image,
          title,
          description,
          generatedDescription: descriptionObject.about,
          writingStyle: descriptionObject.writingStyle,
          topics: descriptionObject.topics,
          idInArticlesDb: userPublication?.id,
        },
      });
      await prisma.userMetadata.update({
        where: {
          userId: session.user.id,
        },
        data: {
          publication: { connect: { id: publicationMetadata.id } },
        },
      });
    }

    const publication: Publication = {
      id: publicationMetadata.id,
      image,
      title,
      description,
    };

    return NextResponse.json({
      publication,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
