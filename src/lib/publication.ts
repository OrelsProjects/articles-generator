import { prismaArticles, prisma } from "@/lib/prisma";
import { PostSchema, PublishedBylineSchema } from "@/lib/schema/posts.schema";
import { getUrlComponents } from "@/lib/utils/url";
import { Byline } from "@/types/article";
import {
  DBArticlesToArticles,
  DBNotesToNotes,
  WriterWithData,
} from "@/types/writer";
import axiosInstance from "@/lib/axios-instance";
import { z } from "zod";
import { Post } from "../../prisma/generated/articles";
import loggerServer from "@/loggerServer";
import { Byline as BylineDB } from "../../prisma/generated/articles";
import { fetchAuthor } from "@/lib/utils/lambda";

export async function getPublicationUpdatedUrl(url: string) {
  const publicationDataResponse = await axiosInstance.get(
    `${url}/api/v1/homepage_data`,
  );
  const posts = publicationDataResponse.data.newPosts;
  const validatedPosts = z.array(PostSchema).parse(posts);
  if (validatedPosts.length === 0) {
    return url;
  }

  if (validatedPosts[0].canonical_url) {
    const { validUrl } = getUrlComponents(validatedPosts[0].canonical_url, {
      withoutWWW: true,
    });
    return validUrl;
  }
  return url;
}

export async function getBylinesByUrl(
  url: string,
  options: { createIfNotExists: boolean } = { createIfNotExists: false },
) {
  const { validUrl } = getUrlComponents(url, { withoutWWW: true });
  if (!validUrl) {
    throw new Error("Invalid URL");
  }

  try {
    const publicationData = await axiosInstance.get(
      `${validUrl}/api/v1/homepage_data`,
    );

    const posts = publicationData.data.newPosts;
    const validatedPosts = z.array(PostSchema).parse(posts);
    if (validatedPosts.length === 0) {
      throw new Error("No posts found");
    }

    const publicationId = validatedPosts[0].publication_id;

    const bylines = validatedPosts
      .flatMap(post => post.publishedBylines)
      .filter(Boolean);

    const nonGuestBylines = bylines.filter(
      byline => !byline?.is_guest,
    ) as z.infer<typeof PublishedBylineSchema>[];

    const publicationBylines = nonGuestBylines.filter(
      byline =>
        byline.publicationUsers?.length && byline.publicationUsers.length > 0,
    );

    const bylineData: Byline[] = publicationBylines.map(byline => ({
      authorId: byline.id,
      handle: byline.handle || "",
      name: byline.name || "",
      photoUrl: byline.photo_url || "",
      bio: byline.bio || "",
    }));

    const uniqueBylines = bylineData.filter(
      (byline, index, self) =>
        index === self.findIndex(t => t.authorId === byline.authorId),
    );

    if (options.createIfNotExists) {
      const bylinesInDB = await prismaArticles.byline.findMany({
        where: {
          id: { in: uniqueBylines.map(byline => byline.authorId) },
        },
      });

      const bylinesToCreate = uniqueBylines.filter(
        byline => !bylinesInDB.some(b => b.id === byline.authorId),
      );

      try {
        for (const byline of bylinesToCreate) {
          const bylineDBCreate: BylineDB = {
            id: byline.authorId,
            name: byline.name,
            handle: byline.handle,
            previousName: byline.name,
            photoUrl: byline.photoUrl,
            bio: byline.bio,
            profileSetUpAt: null,
            twitterScreenName: null,
            isGuest: false,
            bestsellerTier: null,
          };

          const bylineDBUpdate: Partial<BylineDB> = {
            name: byline.name,
            handle: byline.handle,
            previousName: byline.name,
            photoUrl: byline.photoUrl,
            bio: byline.bio,
          };

          //upsert
          await prismaArticles.byline.upsert({
            where: { id: byline.authorId },
            update: bylineDBUpdate,
            create: bylineDBCreate,
          });

          await fetchAuthor({
            authorId: byline.authorId.toString(),
            publicationUrl: validUrl,
          });
        }
      } catch (error: any) {
        loggerServer.error("Failed to create byline", {
          error,
          bylines: uniqueBylines,
          userId: "no-user",
        });
      }
    }

    return uniqueBylines;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch bylines");
  }
}

export async function getWriter(
  handle: string,
  page: number,
  take: number,
): Promise<WriterWithData> {
  const handleNormalized = handle.replace("@", "");

  const byline = await prismaArticles.byline.findFirst({
    where: {
      handle: handleNormalized,
    },
  });

  if (!byline) {
    throw new Error("Byline not found");
  }

  loggerServer.time("Fetching notes from byline");
  const notesFromByline = await prismaArticles.notesComments.findMany({
    where: {
      authorId: Number(byline.id),
      noteIsRestacked: false,
    },
    take,
    skip: (page - 1) * take,
    orderBy: {
      reactionCount: "desc",
    },
  });
  loggerServer.timeEnd("Fetching notes from byline");

  loggerServer.time("Fetching attachments and posts");
  const [attachments] = await Promise.all([
    prismaArticles.notesAttachments.findMany({
      where: {
        noteId: {
          in: notesFromByline.map(note => Number(note.commentId)),
        },
      },
    }),
  ]);

  loggerServer.timeEnd("Fetching attachments and posts");

  const posts = await getWriterPosts(byline.id, page, take);
  const notesWithAttachments = notesFromByline.map(note => ({
    ...note,
    attachments: attachments.filter(
      attachment => attachment.noteId.toString() === note.commentId.toString(),
    ),
  }));

  const articles = DBArticlesToArticles(
    posts.filter(post => post !== null) as Post[],
  );
  const articlesWithoutBody = articles.map(article => ({
    ...article,
    body: "",
    bodyJson: null,
    truncatedBodyText: "",
  }));
  const notes = DBNotesToNotes(notesWithAttachments);

  const writer: WriterWithData = {
    handle: byline.handle || "",
    name: byline.name || "",
    photoUrl: byline.photoUrl || "",
    bio: byline.bio || "",
    authorId: byline.id.toString(),
    topNotes: notes,
    topArticles: articlesWithoutBody,
  };

  return writer;
}

export async function getWriterPosts(
  authorId: number,
  page: number,
  take: number,
) {
  const byline = await prismaArticles.byline.findFirst({
    where: {
      id: authorId,
    },
  });
  if (!byline) {
    throw new Error("Byline not found");
  }

  const postBylines = await prismaArticles.postByline.findMany({
    where: {
      bylineId: byline.id,
    },
  });

  const posts = await prismaArticles.post.findMany({
    where: {
      OR: [
        { id: { in: postBylines.map(byline => byline.postId.toString()) } },
        // { publicationId: publication?.idInArticlesDb?.toString() },
      ],
    },
    take,
    skip: (page - 1) * take,
    orderBy: {
      postDate: "desc", // Get newest posts first based on postDate field
    },
  });

  return DBArticlesToArticles(posts.filter(post => post !== null) as Post[]);
}
