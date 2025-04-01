import prisma, { prismaArticles } from "@/app/api/_db/db";
import { extractContent } from "@/app/api/user/analyze/_utils";
import { authOptions } from "@/auth/authOptions";
import {
  generateDescriptionPrompt,
  generateVectorSearchOptimizedDescriptionPrompt,
} from "@/lib/prompts";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { getTokenCount, runPrompt } from "@/lib/open-router";
import { Publication } from "@/types/publication";
import { getPublicationByUrl } from "@/lib/dal/publication";
import { getUserArticles, getUserArticlesBody } from "@/lib/dal/articles";
import { PublicationNotFoundError } from "@/types/errors/PublicationNotFoundError";
import { Article, ArticleWithBody } from "@/types/article";
import loggerServer from "@/loggerServer";
import { parseJson } from "@/lib/utils/json";
import { buildSubstackUrl } from "@/lib/utils/url";
import { setPublications as scrapePosts } from "@/lib/utils/publication";
import { z } from "zod";
import { fetchAuthor } from "@/lib/lambda";

const schema = z.object({
  url: z.string(),
  byline: z.object({
    authorId: z.number(),
    name: z.string(),
    handle: z.string(),
    photoUrl: z.string(),
    bio: z.string(),
  }),
});

export const maxDuration = 300; // This function can run for a maximum of 5 minutes

const MAX_ARTICLES_TO_GET_BODY = 30;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const body = await req.json();
  const { url, byline } = schema.parse(body);
  try {
    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId,
      },
      include: {
        publication: true,
      },
    });

    if (!userMetadata) {
      // Create one to avoid running through all the process just to throw an error
      await prisma.userMetadata.create({
        data: {
          userId,
        },
      });
    }

    let publicationMetadata = userMetadata?.publication;

    let publications = await getPublicationByUrl(url, {
      createIfNotFound: true,
    });
    let userPublication = publications[0];

    await scrapePosts(url, MAX_ARTICLES_TO_GET_BODY);

    if (!userPublication) {
      // Need to analyze it.
      console.time("Setting publications");
      console.timeEnd("Setting publications");
      publications = await getPublicationByUrl(url);
      userPublication = publications[0];
      if (!userPublication) {
        return NextResponse.json(
          { error: "The publication was not found." },
          { status: 404 },
        );
      }
    }

    console.time("Getting user articles with body");
    const userArticles: Article[] = await getUserArticles(
      { publicationId: Number(userPublication.id) },
      {
        limit: 150,
        freeOnly: false,
        scrapeIfNotFound: true,
      },
    );
    console.timeEnd("Getting user articles with body");

    // Check if the articles have a bodyText
    // If less than 50%, get their body as well.
    let articlesWithBody = userArticles.filter(article => article.bodyText);
    if (articlesWithBody.length <= userArticles.length * 0.5) {
      const freeArticles = userArticles.filter(
        article => article.audience === "everyone",
      );
      const paidArticles = userArticles.filter(
        article => article.audience !== "everyone",
      );

      const articlesToGetBody = [...freeArticles, ...paidArticles].slice(
        0,
        MAX_ARTICLES_TO_GET_BODY,
      );
      articlesWithBody = await getUserArticlesBody(articlesToGetBody);
      try {
        // Insert one by one, batches of 10
        const batchSize = 10;
        for (let i = 0; i < articlesWithBody.length; i += batchSize) {
          const batch = articlesWithBody.slice(i, i + batchSize);
          const promises = batch.map(article =>
            prismaArticles.post.update({
              where: { id: article.id },
              data: { bodyText: article.bodyText },
            }),
          );
          await Promise.all(promises);
        }
      } catch (error: any) {
        loggerServer.error("Error updating article body:", error);
      }
    }

    const { image, title, description } = await extractContent(
      userPublication.customDomain || url,
    );

    let top60Articles = (await getUserArticles(
      { publicationId: Number(userPublication.id) },
      {
        limit: 60,
        freeOnly: false,
        order: {
          by: "reactionCount",
          direction: "desc",
        },
      },
    )) as ArticleWithBody[];

    let count = getTokenCount(top60Articles.map(a => a.bodyText).join("\n"));
    while (count > 120000) {
      top60Articles.shift(); // remove the worst-performing article
      count = getTokenCount(top60Articles.map(a => a.bodyText).join("\n"));
    }

    const messages = generateDescriptionPrompt(description, top60Articles);

    let generatedDescription = "";
    try {
      generatedDescription = await runPrompt(
        messages,
        "google/gemini-2.5-pro-exp-03-25:free",
      );
      if (!generatedDescription) {
        throw new Error("No generated description");
      }
    } catch (error: any) {
      loggerServer.error("Error generating description:", error);
      generatedDescription = await runPrompt(
        messages,
        "anthropic/claude-3.7-sonnet",
      );
    }

    const descriptionObject: {
      about: string;
      aboutGeneral: string;
      writingStyle: string;
      topics: string;
      personality: string;
      specialEvents: string;
      privateLife: string;
      highlights: string;
    } = await parseJson(generatedDescription);

    if (publicationMetadata) {
      await prisma.publicationMetadata.update({
        where: {
          id: publicationMetadata.id,
        },
        data: {
          authorId: byline.authorId,
          generatedDescription: descriptionObject.about,
          generatedAboutGeneral: descriptionObject.aboutGeneral,
          writingStyle: descriptionObject.writingStyle,
          topics: descriptionObject.topics,
          personality: descriptionObject.personality,
          specialEvents: descriptionObject.specialEvents,
          privateLife: descriptionObject.privateLife,
          highlights: descriptionObject.highlights,
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
          generatedAboutGeneral: descriptionObject.aboutGeneral,
          writingStyle: descriptionObject.writingStyle,
          topics: descriptionObject.topics,
          personality: descriptionObject.personality,
          specialEvents: descriptionObject.specialEvents,
          privateLife: descriptionObject.privateLife,
          highlights: descriptionObject.highlights,
          idInArticlesDb: Number(userPublication.id),
          authorId: byline.authorId,
        },
      });
    }

    await prisma.userMetadata.update({
      where: {
        userId,
      },
      data: {
        publication: { connect: { id: publicationMetadata.id } },
      },
    });

    const publicationFromDb = (await getPublicationByUrl(url))?.[0];

    const publication: Publication = {
      id: publicationMetadata.id,
      image,
      title: userPublication?.name || userPublication?.copyright || "",
      description,
      url:
        buildSubstackUrl(
          publicationFromDb?.subdomain,
          publicationFromDb?.customDomain,
        ) || "",
    };

    await fetchAuthor({
      authorId: byline.authorId.toString(),
      publicationUrl: url,
    });

    const generatedDescriptionForSearch = await runPrompt(
      generateVectorSearchOptimizedDescriptionPrompt(publicationMetadata),
      "anthropic/claude-3.7-sonnet",
    );

    const parsedGeneratedDescriptionForSearch = await parseJson<{
      optimizedDescription: string;
    }>(generatedDescriptionForSearch);

    await prisma.publicationMetadata.update({
      where: { id: publication.id },
      data: {
        generatedDescriptionForSearch:
          parsedGeneratedDescriptionForSearch.optimizedDescription,
      },
    });

    return NextResponse.json({
      publication,
    });
  } catch (error: any) {
    loggerServer.error("Error analyzing publication:", error);
    if (error instanceof PublicationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 },
    );
  }
}
