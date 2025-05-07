import { prisma, prismaArticles } from "@/app/api/_db/db";
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
import {
  getPublicationByUrl,
  updatePublication,
  updatePublicationCustomDomain,
} from "@/lib/dal/publication";
import { getUserArticles, getUserArticlesBody } from "@/lib/dal/articles";
import { PublicationNotFoundError } from "@/types/errors/PublicationNotFoundError";
import { Article, ArticleWithBody, DescriptionObject } from "@/types/article";
import loggerServer from "@/loggerServer";
import { parseJson } from "@/lib/utils/json";
import { buildSubstackUrl } from "@/lib/utils/url";
import { setPublications as scrapePosts } from "@/lib/utils/publication";
import { z } from "zod";
import { fetchAuthor } from "@/lib/utils/lambda";
import { canUseAI, undoUseCredits, useCredits } from "@/lib/utils/credits";
import { AIUsageType } from "@prisma/client";
import { sendMailSafe } from "@/lib/mail/mail";
import { generatePublicationAnalysisCompleteEmail } from "@/lib/mail/templates";
import { getBylineByUserId } from "@/lib/dal/byline";
import { setUserNotesDescription } from "@/lib/dal/analysis";

const schema = z.object({
  url: z.string().optional(),
  byline: z
    .object({
      authorId: z.number(),
      name: z.string(),
      handle: z.string(),
      photoUrl: z.string(),
      bio: z.string(),
    })
    .optional(),
});

export const maxDuration = 600; // This function can run for a maximum of 10 minutes

const MAX_ARTICLES_TO_GET_BODY = 30;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const text = await req.text();
  const body = JSON.parse(text || "{}");
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  let { url, byline } = parsed.data;
  let didConsumeCredits = false;
  try {
    const canUseAnalyze = await canUseAI(userId, AIUsageType.analyze);
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

    if (!byline) {
      const bylineFromDb = await getBylineByUserId(userId);
      if (!bylineFromDb) {
        return NextResponse.json({ error: "No byline found" }, { status: 404 });
      }
      byline = {
        authorId: bylineFromDb.id,
        name: bylineFromDb.name || "",
        handle: bylineFromDb.handle || "",
        photoUrl: bylineFromDb.photoUrl || "",
        bio: bylineFromDb.bio || "",
      };
    }

    if (!url) {
      if (!userMetadata?.publication?.publicationUrl) {
        return NextResponse.json(
          { error: "No publication found" },
          { status: 404 },
        );
      }
      url = userMetadata?.publication?.publicationUrl;
    }

    // TODO: FIX IT. It sends 403 to some people
    if (userMetadata?.publication?.generatedDescription) {
      // It's not the first time we're running this.
      // if (!canUseAnalyze.result) {
      //   return NextResponse.json(
      //     {
      //       error: "Not enough credits",
      //       nextRefill: canUseAnalyze.nextRefill,
      //     },
      //     { status: canUseAnalyze.status },
      //   );
      // }
      // await useCredits(session.user.id, "analyze");
      // didConsumeCredits = true;
    }

    let publicationMetadata = userMetadata?.publication;

    loggerServer.info("Getting publication by url", { url, userId });
    console.time("Getting publication by url");
    let publications = await getPublicationByUrl(url, {
      createIfNotFound: true,
    });
    let userPublication = publications[0];

    await prisma.settings.upsert({
      where: {
        userId,
      },
      update: {
        generatingDescription: true,
      },
      create: {
        userId,
        generatingDescription: true,
      },
    });
    console.timeEnd("Getting publication by url");

    loggerServer.info("Scraping posts", { url, userId });
    console.time("Scraping posts");
    await scrapePosts(url, MAX_ARTICLES_TO_GET_BODY, byline.authorId);
    console.timeEnd("Scraping posts");

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
      const articlesBody = await getUserArticlesBody(
        articlesToGetBody.map(it => ({
          canonicalUrl: it.canonicalUrl,
          id: Number(it.id),
          bodyText: it.bodyText || "",
        })),
      );

      articlesWithBody = articlesWithBody.map(article => {
        const articleBody = articlesBody.find(
          it => it.canonicalUrl === article.canonicalUrl,
        );
        return { ...article, bodyText: articleBody?.bodyText || "" };
      });

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
        loggerServer.error("Error updating article body:", {
          error,
          userId: session?.user.id,
        });
      }
    }

    const { image, title, description } = await extractContent(
      url || userPublication.customDomain || "",
    );

    if (userPublication.customDomain) {
      await updatePublicationCustomDomain(
        userPublication.id.toString(),
        userPublication.customDomain,
        url,
      );
    }

    await updatePublication(userPublication.id.toString(), {
      logoUrl: image,
      name: title,
      heroText: description,
    });

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

    const generatedDescription = await runPrompt(
      messages,
      "deepseek/deepseek-r1",
    );

    const descriptionObject: DescriptionObject =
      await parseJson(generatedDescription);

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
      publicationId: publicationFromDb?.id.toString(),
    });

    const generatedDescriptionForSearch = await runPrompt(
      generateVectorSearchOptimizedDescriptionPrompt(publicationMetadata),
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

    if (didConsumeCredits) {
      // The user has requested a refresh, update notes as well.
      await setUserNotesDescription(userId, byline.authorId);
    }

    if (session.user.email) {
      const email = generatePublicationAnalysisCompleteEmail();
      // send mail
      await sendMailSafe({
        to: session.user.email,
        from: "noreply",
        subject: email.subject,
        template: email.body,
      });
    }

    return NextResponse.json({
      publication,
      descriptionObject,
    });
  } catch (error: any) {
    loggerServer.error(
      `Error analyzing publication: ${error}\nfor user: ${userId}`,
    );
    if (didConsumeCredits) {
      await undoUseCredits(session.user.id, "analyze");
    }
    if (error instanceof PublicationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 },
    );
  } finally {
    await prisma.settings.upsert({
      where: { userId },
      update: { generatingDescription: false },
      create: { userId, generatingDescription: false },
    });
  }
}
