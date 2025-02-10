import prisma from "@/app/api/_db/db";
import { extractContent } from "@/app/api/user/analyze/_utils";
import { authOptions } from "@/auth/authOptions";
import { generateDescriptionPrompt } from "@/lib/prompts";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { runPrompt } from "@/lib/openRouter";
import { Publication } from "@/types/publication";
import { getPublicationByUrl } from "@/lib/dal/publication";
import { getUserArticlesWithBody } from "@/lib/dal/articles";
import { PublicationNotFoundError } from "@/types/errors/PublicationNotFoundError";

export const maxDuration = 60; // This function can run for a maximum of 5 seconds


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

    if (!userPublication) {
      return NextResponse.json(
        { error: "The publication was not found." },
        { status: 404 },
      );
    }

    const userArticles = await getUserArticlesWithBody(
      { publicationId: userPublication.id },
      {
        limit: 10,
        freeOnly: true,
      },
    );

    const { image, title, description } = await extractContent(
      userPublication.customDomain || url,
    );
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
          idInArticlesDb: Number(userPublication.id),
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
          idInArticlesDb: Number(userPublication.id),
        },
      });
    }

    await prisma.userMetadata.update({
      where: {
        userId: session.user.id,
      },
      data: {
        publication: { connect: { id: publicationMetadata.id } },
      },
    });

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
    if (error instanceof PublicationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 },
    );
  }
}
