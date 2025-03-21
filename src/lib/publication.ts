import { PostSchema, PublishedBylineSchema } from "@/lib/schema/posts.schema";
import { getUrlComponents, toValidUrl } from "@/lib/utils/url";
import { Byline } from "@/types/article";
import axios from "axios";
import { z } from "zod";

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
    debugger;
    console.error(error);
    throw new Error("Failed to fetch bylines");
  }
}
