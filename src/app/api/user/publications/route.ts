import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import prisma, { prismaArticles } from "@/app/api/_db/db";
import { PublicationResponse } from "@/types/publication";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const userPublication = await prisma.userMetadata.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        publication: {
          include: {
            ideas: true,
          },
        },
      },
    });

    if (!userPublication?.publication) {
      return NextResponse.json({ publicationId: null }, { status: 200 });
    }

    const publication = await prismaArticles.publication.findUnique({
      where: {
        id: userPublication?.publication?.idInArticlesDb || 0,
      },
    });

    const response: PublicationResponse = {
      publicationId: userPublication?.publication?.id,
      image: userPublication?.publication?.image,
      title:
        userPublication?.publication?.title ||
        publication?.name ||
        publication?.copyright ||
        "",
      description: userPublication?.publication?.description,
      ideas: userPublication?.publication?.ideas.map(idea => ({
        id: idea.id,
        topic: idea.topic,
        title: idea.title,
        subtitle: idea.subtitle,
        outline: idea.outline,
        description: idea.description,
        inspiration: idea.inspiration,
        status: idea.status,
        isFavorite: idea.isFavorite,
        modelUsedForIdeas: idea.modelUsedForIdeas,
        modelUsedForOutline: idea.modelUsedForOutline,
      })),
    };

    return NextResponse.json({ publication: response }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
