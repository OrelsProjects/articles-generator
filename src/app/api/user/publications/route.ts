import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import prisma, { prismaArticles } from "@/app/api/_db/db";
import { PublicationResponse } from "@/types/publication";
import loggerServer from "@/loggerServer";
import { buildSubstackUrl } from "@/lib/utils/url";
import { Idea } from "@/types/idea";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    process.env.NODE_ENV === "development" &&
    process.env.DATABASE_URL?.includes("production")
  ) {
    // Avoid messing with production database
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

    let ideas: Omit<Idea, "didUserSee">[] = [];

    const publication = await prismaArticles.publication.findUnique({
      where: {
        id: userPublication?.publication?.idInArticlesDb || 0,
      },
    });

    if (!publication || !userPublication?.publication) {
      ideas = await prisma.idea.findMany({
        where: {
          userId: session.user.id,
        },
      });
    } else {
      ideas = userPublication.publication.ideas || [];
    }

    const response: PublicationResponse = {
      id: userPublication?.publication?.id,
      image: userPublication?.publication?.image || null,
      url:
        buildSubstackUrl(publication?.subdomain, publication?.customDomain) ||
        "",
      title:
        userPublication?.publication?.title ||
        publication?.name  ||
        publication?.copyright ||
        "",
      description: userPublication?.publication?.description || null,
      ideas: ideas.map(idea => ({
        id: idea.id,
        topic: idea.topic,
        title: idea.title,
        subtitle: idea.subtitle,
        outline: idea.outline,
        description: idea.description,
        inspiration: idea.inspiration,
        body: idea.body,
        status: idea.status,
        image: idea.image,
        search: idea.search,
        isFavorite: idea.isFavorite,
        modelUsedForIdeas: idea.modelUsedForIdeas,
        modelUsedForOutline: idea.modelUsedForOutline,
        updatedAt: idea.updatedAt,
        bodyHistory: idea.bodyHistory,
      })) || [],
    };

    return NextResponse.json({ publication: response }, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Error in publications route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
