import { prismaArticles } from "@/app/api/_db/db";
import { PostSchema, PublishedBylineSchema } from "@/lib/schema/posts.schema";
import { getUrlComponents, toValidUrl } from "@/lib/utils/url";
import { Byline } from "@/types/article";
import { DBArticlesToArticles, DBNotesToNotes, Writer } from "@/types/writer";
import axios from "axios";
import { z } from "zod";
import { Post } from "../../prisma/generated/articles";

export async function getBylines(url: string) {
  const { validUrl } = getUrlComponents(url);
  if (!validUrl) {
    throw new Error("Invalid URL");
  }

  try {
    const publicationData = await axios.get(`${validUrl}/api/v1/homepage_data`);

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
        byline.publicationUsers?.length &&
        byline.publicationUsers.length > 0 &&
        byline.publicationUsers.some(
          user => user.publication_id === publicationId,
        ),
    );

    const bylineData: Byline[] = publicationBylines.map(byline => ({
      authorId: byline.id,
      handle: byline.handle,
      name: byline.name,
      photoUrl: byline.photo_url,
      bio: byline.bio,
    }));

    const uniqueBylines = bylineData.filter(
      (byline, index, self) =>
        index === self.findIndex(t => t.authorId === byline.authorId),
    );

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
): Promise<Writer> {
  const handleNormalized = handle.replace("@", "");

  const byline = await prismaArticles.byline.findFirst({
    where: {
      handle: handleNormalized,
    },
  });

  if (!byline) {
    throw new Error("Byline not found");
  }

  const [notesFromByline, postBylines] = await Promise.all([
    prismaArticles.notesComments.findMany({
      where: {
        authorId: Number(byline.id),
        noteIsRestacked: false,
      },
      take,
      skip: (page - 1) * take,
      orderBy: {
        reactionCount: "desc",
      },
    }),
    prismaArticles.postByline.findMany({
      where: {
        bylineId: byline.id,
      },
    }),
  ]);

  const [attachments, posts] = await Promise.all([
    prismaArticles.notesAttachments.findMany({
      where: {
        noteId: {
          in: notesFromByline.map(note => Number(note.commentId)),
        },
      },
    }),
    prismaArticles.post.findMany({
      where: {
        id: { in: postBylines.map(byline => byline.postId.toString()) },
      },
      take,
      skip: (page - 1) * take,
      orderBy: {
        reactionCount: "desc",
      },
    }),
  ]);

  const notesWithAttachments = notesFromByline.map(note => ({
    ...note,
    attachments: attachments.filter(
      attachment => attachment.noteId.toString() === note.commentId.toString(),
    ),
  }));

  const articles = DBArticlesToArticles(
    posts.filter(post => post !== null) as Post[],
  );
  const notes = DBNotesToNotes(notesWithAttachments);

  const writer: Writer = {
    handle: byline.handle || "",
    name: byline.name || "",
    photoUrl: byline.photoUrl || "",
    bio: byline.bio || "",
    topNotes: notes,
    topArticles: articles,
  };

  return writer;
}
