import * as cheerio from "cheerio";
import { prismaArticles } from "@/lib/prisma";
import { Post, Publication } from "../../../prisma/generated/articles";
import { fetchWithHeaders } from "./requests";
import loggerServer from "@/loggerServer";
import {
  getUserArticles as getUserPosts,
  getUserArticlesBody,
} from "@/lib/dal/articles";
import { getUrlComponents, toValidUrl } from "@/lib/utils/url";
import axiosInstance from "@/lib/axios-instance";

export const getArticleEndpoint = (
  url: string,
  offset: number,
  limit: number,
) => {
  return `${url}/api/v1/archive?sort=top&search=&offset=${offset}&limit=${limit}`;
};

interface SubstackPublication {
  id: string;
  name: string;
  subdomain: string;
  custom_domain: string;
  custom_domain_optional: boolean;
  hero_text: string;
  logo_url: string;
  author_id?: string;
  theme_var_background_pop: string;
  created_at?: string;
  rss_website_url?: string;
  email_from_name?: string;
  copyright?: string;
  founding_plan_name: string | null;
  community_enabled: boolean;
  invite_only: boolean;
  payments_state: string;
  language: string | null;
  explicit: boolean;
  is_personal_mode: boolean;
}

/**
 * Substack API response types
 */
interface SubstackBylinePublicationUser {
  id: string;
  user_id: string;
  publication_id: string;
  role: string;
  public: boolean;
  is_primary: boolean;
  byline_id?: string;
  publication?: SubstackPublication;
}

interface Byline {
  id: string;
  name: string;
  handle: string;
  previous_name?: string;
  photo_url?: string;
  bio?: string;
  profile_set_up_at?: string;
  twitter_screen_name?: string;
  is_guest?: boolean;
  bestseller_tier?: string;
  publicationUsers?: SubstackBylinePublicationUser[];
}
interface AudioItem {
  post_id: string;
  voice_id: string;
  audio_url: string;
  type: string;
  status: string;
}

interface AudioItem {
  post_id: string;
  voice_id: string;
  audio_url: string;
  type: string;
  status: string;
}

interface PodcastField {
  post_id: string;
  podcast_episode_number?: number;
  podcast_season_number?: number;
  podcast_episode_type?: string;
  should_syndicate_to_other_feed: boolean;
  syndicate_to_section_id?: string;
  hide_from_feed: boolean;
  free_podcast_url?: string;
  free_podcast_duration?: number;
}

interface SubstackPost {
  id: string;
  publication_id: string;
  title?: string;
  social_title?: string;
  search_engine_title?: string;
  search_engine_description?: string;
  slug?: string;
  post_date?: string;
  audience?: string;
  canonical_url?: string;
  reactions?: any;
  subtitle?: string;
  cover_image?: string;
  cover_image_is_square?: boolean;
  cover_image_is_explicit?: boolean;
  description?: string;
  body_json?: any;
  body_text?: string;
  truncated_body_text?: string;
  wordcount?: number;
  postTags?: any[];
  reaction?: any;
  reaction_count?: number;
  comment_count?: number;
  child_comment_count?: number;
  hidden?: boolean;
  explicit?: boolean;
  email_from_name?: string;
  is_guest?: boolean;
  bestseller_tier?: string;
  podcast_episode_image_info?: any;
  publishedBylines?: Byline[];
  audio_items?: AudioItem[];
  podcastFields?: PodcastField;
  [key: string]: any;
}
/**
 * Return object containing arrays ready to insert/upsert into your DB tables.
 */
function convertPostsToDbRows(post: SubstackPost): {
  post: Post;
  bylines: Byline[];
  audioItems: AudioItem[];
  podcastFields?: PodcastField;
} {
  // We'll map out only the data that matches your schema
  return {
    post: {
      id: post.id,
      publicationId: post.publication_id.toString(), // Potential mismatch if not numeric
      title: post.title || "",
      postDate: post.post_date ? new Date(post.post_date) : new Date(),
      socialTitle: post.social_title || null,
      searchEngineTitle: post.search_engine_title || null,
      searchEngineDescription: post.search_engine_description || null,
      slug: post.slug || null,
      audience: post.audience || null,
      canonicalUrl: post.canonical_url || null,
      reactions: post.reactions || null,
      subtitle: post.subtitle || null,
      coverImage: post.cover_image || null,
      coverImageIsSquare: post.cover_image_is_square || false,
      coverImageIsExplicit: post.cover_image_is_explicit || false,
      description: post.description || null,
      bodyJson: post.body_json || null,
      bodyText: post.body_text || null,
      truncatedBodyText: post.truncated_body_text || null,
      wordcount: post.wordcount || 0,
      postTags: post.postTags || null,
      reaction: post.reaction || null,
      reactionCount: post.reaction_count || 0,
      commentCount: post.comment_count || 0,
      childCommentCount: post.child_comment_count || 0,
      hidden: "false",
      explicit: post.explicit || false,
      emailFromName: post.email_from_name || null,
      isGuest: post.is_guest || false,
      bestsellerTier: post.bestseller_tier || null,
      podcastEpisodeImageInfo: post.podcast_episode_image_info || null,
    },
    bylines: post.publishedBylines ?? [],
    audioItems: post.audio_items ?? [],
    podcastFields: post.podcastFields,
  };
}

const STEP = 23;

function extractPublications(posts: SubstackPost[]) {
  const publicationMap = new Map<string, Publication>();
  for (const item of posts) {
    const pubId = item.publication_id;
    if (!pubId) continue;
    let publication: any = null;
    let publicationUser: any = null;
    if (!publicationMap.has(pubId.toString())) {
      const publishedBylines = item.publishedBylines;
      if (publishedBylines && publishedBylines.length > 0) {
        for (const byline of publishedBylines) {
          const publicationUsers = byline.publicationUsers;
          if (publicationUsers && publicationUsers.length > 0) {
            for (const pu of publicationUsers) {
              if (pu.publication?.id === pubId) {
                publication = pu.publication;
                publicationUser = pu;
                break;
              }
            }
          }
          if (publication) {
            break;
          }
        }
      }

      publicationMap.set(pubId.toString(), {
        id: BigInt(pubId),
        name: publication?.name || "",
        subdomain: publication?.subdomain || "",
        customDomain:
          publication?.custom_domain ||
          (publication?.subdomain
            ? `https://${publication.subdomain}.substack.com`
            : ""),
        customDomainOptional: publication?.custom_domain_optional || false,
        heroText: publication?.hero_text || "",
        logoUrl: publication?.logo_url || "",
        authorId: publicationUser?.user_id,
        themeVarBackgroundPop: publication?.theme_var_background_pop || "",
        createdAt: publication?.created_at,
        rssWebsiteUrl: publication?.rss_website_url,
        emailFromName: publication?.email_from_name,
        copyright: publication?.copyright,
        foundingPlanName: null,
        communityEnabled: false,
        inviteOnly: false,
        paymentsState: "disabled",
        language: null,
        explicit: false,
        isPersonalMode: false,
      });
    }
  }
  return Array.from(publicationMap.values());
}

/**
 * Populate a single publication by scraping its posts
 * from Substack and writing to the DB.
 */
export async function populatePublications(
  url: string,
  maxArticlesToGetBody = 60,
  byline?: number,
  options?: {
    stopIfNoNewPosts?: boolean;
  },
): Promise<Array<{ url: string; status: string }>> {
  const publicationsStatus: Array<{ url: string; status: string }> = [];
  const allPosts: SubstackPost[] = [];
  loggerServer.time("Getting user posts");
  const currentUserPosts = await getUserPosts(
    { url, authorId: Number(byline) },
    {
      scrapeIfNotFound: false,
    },
  );
  loggerServer.timeEnd("Getting user posts");

  const postsWithBody = currentUserPosts.filter(post => post.bodyText);
  if (postsWithBody.length > currentUserPosts.length * 0.5) {
    return [{ url, status: "completed" }];
  }

  for (let i = 0; i < 300; i += STEP) {
    const subUrl = getArticleEndpoint(url, i, STEP);
    const data = await fetchWithHeaders(subUrl);
    if (!data || data.length === 0) {
      loggerServer.error(`No data for ${subUrl}`);
      break;
    }
    const postsNotInCurrentUserPosts = data.filter(
      (post: SubstackPost) =>
        !currentUserPosts.some(p => `${p.id}` === `${post.id}`),
    );
    if (postsNotInCurrentUserPosts.length > 0) {
      allPosts.push(...postsNotInCurrentUserPosts);
    } else {
      if (options?.stopIfNoNewPosts) {
        break;
      }
    }
  }

  const postsToGetBody = [...allPosts]
    .sort((a, b) => (b.reactionCount || 0) - (a.reactionCount || 0))
    .slice(0, maxArticlesToGetBody);

  // Getting body text for posts
  for (const post of postsToGetBody) {
    const formattedPost = {
      ...post,
      canonicalUrl: post.canonical_url || "",
    };
    const body = await getUserArticlesBody([
      {
        canonicalUrl: formattedPost.canonical_url || "",
        id: Number(formattedPost.id),
        bodyText: formattedPost.body_text || "",
      },
    ]);
    const { canonicalUrl, ...restOfPost } = body[0];
    post.body_text = restOfPost.bodyText;
  }

  // Extract publications from allPosts
  const publications = extractPublications(allPosts);

  try {
    const dbItems = allPosts.map(post => convertPostsToDbRows(post));
    // 1) Insert ALL Posts First
    const postsBatches: {
      post: Post;
      bylines: Byline[];
      audioItems: AudioItem[];
      podcastFields?: PodcastField;
    }[][] = [];
    const batchSize = 20;
    for (let i = 0; i < allPosts.length; i += batchSize) {
      const batch = dbItems.slice(i, i + batchSize);
      postsBatches.push(batch);
    }
    for (const batch of postsBatches) {
      const promises: Promise<any>[] = [];
      for (const batchItem of batch) {
        const postData = batchItem.post;
        promises.push(
          prismaArticles.post.upsert({
            where: { id: postData.id.toString() },
            update: {
              ...postData,
              id: postData.id.toString(),
              reactions: postData.reactions as any,
              bodyJson: postData.bodyJson as any,
              postTags: postData.postTags as any,
              reaction: postData.reaction as any,
              hidden: `${postData.hidden}`,
              podcastEpisodeImageInfo: postData.podcastEpisodeImageInfo as any,
            },
            create: {
              ...postData,
              id: postData.id.toString(),
              reactions: postData.reactions as any,
              bodyJson: postData.bodyJson as any,
              postTags: postData.postTags as any,
              reaction: postData.reaction as any,
              hidden: `${postData.hidden}`,
              podcastEpisodeImageInfo: postData.podcastEpisodeImageInfo as any,
            },
          }),
        );
      }
      await Promise.all(promises);
    }

    // 2) Insert ALL Publications Next
    for (const publication of publications) {
      const existingPublication = await prismaArticles.publication.findUnique({
        where: { id: publication.id },
      });
      if (existingPublication) {
        continue;
      }
      const countPublications = await prismaArticles.publication.upsert({
        where: { id: publication.id },
        update: { ...publication },
        create: { ...publication },
      });
      console.log(`Inserted ${countPublications} publications`);
    }

    // unique bylines by id
    const allBylines = dbItems
      .flatMap(item => item.bylines)
      .filter(
        (byline, index, self) =>
          index === self.findIndex(t => t.id === byline.id),
      );
    // unique by userId
    const allBylinePublicationUsers = dbItems
      .flatMap(item =>
        item.bylines.flatMap(byline =>
          byline.publicationUsers?.map(bpu => ({
            ...bpu,
            bylineId: byline.id,
          })),
        ),
      )
      .filter(
        (bpu, index, self) =>
          index === self.findIndex(t => t?.user_id === bpu?.user_id),
      );

    for (const byline of allBylines) {
      const numericBylineId = parseInt(byline.id, 10);
      if (isNaN(numericBylineId)) continue;

      // Upsert Byline
      const countBylines = await prismaArticles.byline.upsert({
        where: { id: numericBylineId },
        update: {
          id: numericBylineId,
          name: byline.name,
          handle: byline.handle,
          previousName: byline.previous_name || null,
          photoUrl: byline.photo_url || null,
          bio: byline.bio || null,
        },
        create: {
          id: numericBylineId,
          name: byline.name,
          handle: byline.handle,
          previousName: byline.previous_name || null,
          photoUrl: byline.photo_url || null,
          bio: byline.bio || null,
        },
      });
      console.log(`Inserted ${countBylines} bylines`);
    }

    for (const bpu of allBylinePublicationUsers) {
      if (!bpu) continue;
      const countBylinePublicationUsers =
        await prismaArticles.bylinePublicationUser.upsert({
          where: { id: BigInt(bpu.id) },
          update: {
            userId: BigInt(bpu.user_id),
            publicationId: BigInt(bpu.publication_id),
            role: bpu.role,
            public: bpu.public,
            isPrimary: bpu.is_primary,
            bylineId: BigInt(bpu.bylineId),
          },
          create: {
            id: BigInt(bpu.id),
            userId: BigInt(bpu.user_id),
            publicationId: BigInt(bpu.publication_id),
            role: bpu.role,
            public: bpu.public,
            isPrimary: bpu.is_primary,
            bylineId: BigInt(bpu.bylineId),
          },
        });
      console.log(
        `Inserted ${countBylinePublicationUsers} bylinePublicationUsers`,
      );
    }

    publicationsStatus.push({ url, status: "completed" });
  } catch (error: any) {
    loggerServer.error("Failed to populate publications:", error);
    publicationsStatus.push({ url, status: "failed" });
  }

  return publicationsStatus;
}

/**
 * Helper to get the count of publication sitemaps
 * from the top-level Substack sitemap.
 */
export async function getPublicationsCount(url: string): Promise<number> {
  try {
    const data = await fetchWithHeaders(url);
    if (!data) return 0;

    // The Substack top-level sitemap is an XML.
    // We'll do a quick parse to find how many `loc` entries contain "publications-"
    const $ = cheerio.load(data, { xmlMode: true });
    const locElements = $("urlset url loc");
    let count = 0;
    locElements.each((_, el) => {
      const loc = $(el).text();
      if (loc.includes("publications-")) {
        count++;
      }
    });
    return count;
  } catch (error) {
    console.error("Error fetching sitemap:", error);
    return 0;
  }
}

/**
 * Given a total number of publication sitemaps,
 * scrape each to collect publication links.
 */
export async function scrapeAllPublicationsLinks(
  publicationsCount: number,
): Promise<string[]> {
  const allPublicationsLinks: string[] = [];

  for (let i = 1; i <= publicationsCount; i++) {
    console.log(`Scraping page ${i} of ${publicationsCount}`);
    const url = `https://substack.com/sitemap/publications-${i}`;
    const data = await fetchWithHeaders(url, 3, 0);
    if (!data) continue;

    const $ = cheerio.load(data);
    const hrefs: string[] = [];
    $("a.sitemap-link").each((_, element) => {
      const href = $(element).attr("href");
      if (href) {
        hrefs.push(href);
      }
    });
    allPublicationsLinks.push(...hrefs);
  }

  return allPublicationsLinks;
}

/**
 * High-level function to scrape links from the root sitemap
 * and write them to a file.
 */
export async function scrapeLinks(): Promise<void> {
  const sitemapUrl = "https://substack.com/sitemap-sitemap.xml";
  const publicationsCount = await getPublicationsCount(sitemapUrl);

  if (publicationsCount === 0) {
    console.error("Failed to retrieve publication count. Exiting.");
    return;
  }

  const allPublicationsLinks =
    await scrapeAllPublicationsLinks(publicationsCount);
  console.log(`Scraping complete. Saved ${allPublicationsLinks.length} links.`);
}

/**
 * setPublications logic:
 * 1. If a specific URL is provided, populate that single publication.
 * 2. Otherwise, get up to 500 `publication_links` with null status,
 *    set started_at, call populatePublications for each, then update DB.
 */
export async function scrapePosts(
  url: string,
  maxArticlesToGetBody = 60,
  byline?: number,
  options?: {
    stopIfNoNewPosts?: boolean;
  },
): Promise<void> {
  url = toValidUrl(url);
  await populatePublications(url, maxArticlesToGetBody, byline, options);
}
