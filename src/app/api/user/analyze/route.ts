import prisma, { prismaArticles } from "@/app/api/_db/db";
import { extractContent } from "@/app/api/user/analyze/_utils";
import { authOptions } from "@/auth/authOptions";
import { generateDescriptionPrompt } from "@/lib/prompts";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { runPrompt } from "@/lib/open-router";
import { Publication } from "@/types/publication";
import { getAuthorId, getPublicationByUrl } from "@/lib/dal/publication";
import { getUserArticles, getUserArticlesBody } from "@/lib/dal/articles";
import { PublicationNotFoundError } from "@/types/errors/PublicationNotFoundError";
import { Article } from "@/types/article";
import loggerServer from "@/loggerServer";
import { setPublications } from "@/lib/utils/publication";
import { parseJson } from "@/lib/utils/json";
import { buildSubstackUrl } from "@/lib/utils/url";

export const maxDuration = 300; // This function can run for a maximum of 5 minutes

const MAX_ARTICLES_TO_GET_BODY = 60;

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

    let publications = await getPublicationByUrl(url);
    let userPublication = publications[0];

    if (!userPublication) {
      // Need to analyze it.
      console.time("Setting publications");
      await setPublications({ body: { url } }, true, MAX_ARTICLES_TO_GET_BODY);
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
        freeOnly: true,
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

      const articlesToGetBody = [...freeArticles, ...paidArticles];
      articlesWithBody = await getUserArticlesBody(articlesToGetBody);

      try {
        // Insert one by one, batches of 10
        const batchSize = 10;
        for (let i = 0; i < userArticles.length; i += batchSize) {
          const batch = userArticles.slice(i, i + batchSize);
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
    const top200Articles = userArticles.slice(0, 200).map(article => ({
      ...article,
      canonicalUrl: article.canonicalUrl || "",
      bodyText: article.bodyText || "",
    }));
    // TODO limit by wordcount, so you dont have too many articles and the api request doesnt fail
    const messages = generateDescriptionPrompt(description, top200Articles);

    const generatedDescription = await runPrompt(
      messages,
      "google/gemini-2.0-flash-001",
    );

    const descriptionObject: {
      about: string;
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
          generatedDescription: descriptionObject.about,
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
      const authorId = await getAuthorId(session.user.id);
      publicationMetadata = await prisma.publicationMetadata.create({
        data: {
          publicationUrl: url,
          image,
          title,
          description,
          generatedDescription: descriptionObject.about,
          writingStyle: descriptionObject.writingStyle,
          topics: descriptionObject.topics,
          personality: descriptionObject.personality,
          specialEvents: descriptionObject.specialEvents,
          privateLife: descriptionObject.privateLife,
          idInArticlesDb: Number(userPublication.id),
          authorId,
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

    const scrapeAllArticlesUrl = process.env.TRIGGER_LAMBDAS_LAMBDA_URL;
    if (scrapeAllArticlesUrl) {
      // Run the lambda to scrape all articles and forget about it
      void fetch(scrapeAllArticlesUrl, {
        method: "GET",
        body: JSON.stringify({
          lambdaName: "substack-scraper",
          body: {
            url,
            includeBody: "true",
          },
        }),
      });
    }

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
