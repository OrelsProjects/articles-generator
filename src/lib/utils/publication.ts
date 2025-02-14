// main.ts
/* eslint-disable no-console */
import axios from "axios";
import * as cheerio from "cheerio";
import { prismaArticles } from "@/app/api/_db/db";
import { Post, PublicationLink } from "../../../prisma/generated/articles";
import { delay, fetchWithHeaders } from "./requests";
import loggerServer from "@/loggerServer";
import { getUserArticlesBody } from "@/lib/dal/articles";
import { toValidUrl } from "@/lib/utils/url";

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
}

interface SubstackByline {
  id: string; // or number if it changes
  name: string;
  handle: string;
  previous_name?: string | null;
  photo_url?: string | null;
  bio?: string | null;
  profile_set_up_at?: string | null;
  twitter_screen_name?: string | null;
  is_guest: boolean;
  bestseller_tier?: string | null;
  publicationUsers?: SubstackBylinePublicationUser[];
}

interface SubstackAudioItem {
  post_id: number;
  voice_id: string;
  audio_url: string;
  type: string;
  status: string;
}

interface SubstackPodcastFields {
  post_id: number;
  podcast_episode_number: number;
  podcast_season_number: number;
  podcast_episode_type: string;
  should_syndicate_to_other_feed: boolean;
  syndicate_to_section_id?: number | null;
  hide_from_feed?: boolean;
  free_podcast_url?: string | null;
  free_podcast_duration?: number | null;
}

interface SubstackPost {
  id: string;
  publication_id: string;
  title: string;
  social_title?: string | null;
  search_engine_title?: string | null;
  search_engine_description?: string | null;
  slug: string;
  post_date?: string | null;
  audience?: string | null;
  canonical_url: string;
  reactions?: any; // Replace with a more specific type if known
  subtitle?: string | null;
  cover_image?: string | null;
  cover_image_is_square?: boolean | null;
  cover_image_is_explicit?: boolean | null;
  description?: string | null;
  body_json?: any; // Replace with a more specific type if known
  body_text?: string | null;
  truncated_body_text?: string | null;
  wordcount?: number | null;
  postTags?: any; // Replace with a more specific type if known
  reaction?: any; // Replace with a more specific type if known
  reaction_count?: number | null;
  comment_count?: number | null;
  child_comment_count?: number | null;
  hidden?: string | null;
  explicit?: boolean | null;
  email_from_name?: string | null;
  is_guest?: boolean | null;
  bestseller_tier?: string | null;
  podcast_episode_image_info?: any; // Replace with a more specific type if known

  // Additional arrays from the Substack response
  publishedBylines?: SubstackByline[];
  audio_items?: SubstackAudioItem[];
  podcastFields?: SubstackPodcastFields;
}

/**
 * Return object containing arrays ready to insert/upsert into your DB tables.
 */
function convertPostsToDbRows(posts: SubstackPost) {
  // We'll map out only the data that matches your schema
  return {
    // Because you have an existing model that requires
    // an integer `publicationId` for the `Publication`
    // and the post uses a `string` for `publication_id`,
    // you may need to parse or store it differently.
    // In your schema, `Publication.id` is an Int.
    // If Substack's `publication_id` cannot convert to Int
    // (e.g. "123"), you have a mismatch.
    // => If the ID from Substack is not guaranteed numeric,
    // you may need to unify that logic carefully or
    // adjust your schema.

    post: {
      id: posts.id,
      publicationId: posts.publication_id, // Potential mismatch if not numeric
      title: posts.title,
      socialTitle: posts.social_title || null,
      searchEngineTitle: posts.search_engine_title || null,
      searchEngineDescription: posts.search_engine_description || null,
      slug: posts.slug,
      postDate: posts.post_date ? new Date(posts.post_date) : null,
      audience: posts.audience || null,
      canonicalUrl: posts.canonical_url,
      reactions: posts.reactions || null,
      subtitle: posts.subtitle || null,
      coverImage: posts.cover_image || null,
      coverImageIsSquare: posts.cover_image_is_square || false,
      coverImageIsExplicit: posts.cover_image_is_explicit || false,
      description: posts.description || null,
      bodyJson: posts.body_json || null,
      bodyText: posts.body_text || null,
      truncatedBodyText: posts.truncated_body_text || null,
      wordcount: posts.wordcount || 0,
      postTags: posts.postTags || null,
      reaction: posts.reaction || null,
      reactionCount: posts.reaction_count || 0,
      commentCount: posts.comment_count || 0,
      childCommentCount: posts.child_comment_count || 0,
      hidden: posts.hidden || null,
      explicit: posts.explicit || false,
      emailFromName: posts.email_from_name || null,
      isGuest: posts.is_guest || false,
      bestsellerTier: posts.bestseller_tier || null,
      podcastEpisodeImageInfo: posts.podcast_episode_image_info || null,
    },
    bylines: posts.publishedBylines ?? [],
    audioItems: posts.audio_items ?? [],
    podcastFields: posts.podcastFields,
  };
}

/**
 * Upsert a single Post record.
 */
async function upsertPost(postData: Post): Promise<void> {
  await prismaArticles.post.upsert({
    where: { id: postData.id },
    update: {
      ...postData,
      reactions: postData.reactions as any,
      bodyJson: postData.bodyJson as any,
      postTags: postData.postTags as any,
      reaction: postData.reaction as any,
      podcastEpisodeImageInfo: postData.podcastEpisodeImageInfo as any,
    },
    create: {
      ...postData,
      reactions: postData.reactions as any,
      bodyJson: postData.bodyJson as any,
      postTags: postData.postTags as any,
      reaction: postData.reaction as any,
      podcastEpisodeImageInfo: postData.podcastEpisodeImageInfo as any,
    },
  });
}

/**
 * Upsert a single Byline record.
 */
async function upsertByline(byline: SubstackByline): Promise<void> {
  // Because your Prisma Byline model uses `id` as Int
  // but Substack gives a string `id`,
  // you either need to parse it or store it differently.
  // Example: parseInt(byline.id, 10).
  // If the string is not guaranteed numeric,
  // you'll need to fix your schema or adjust logic here.
  const numericId = parseInt(byline.id, 10);
  if (isNaN(numericId)) {
    console.warn(`Skipping byline with non-numeric ID: ${byline.id}`);
    return;
  }

  await prismaArticles.byline.upsert({
    where: { id: numericId },
    update: {
      name: byline.name,
      handle: byline.handle,
      previousName: byline.previous_name || null,
      photoUrl: byline.photo_url || null,
      bio: byline.bio || null,
      profileSetUpAt: byline.profile_set_up_at
        ? new Date(byline.profile_set_up_at)
        : null,
      twitterScreenName: byline.twitter_screen_name || null,
      isGuest: byline.is_guest,
      bestsellerTier: byline.bestseller_tier || null,
    },
    create: {
      id: numericId,
      name: byline.name,
      handle: byline.handle,
      previousName: byline.previous_name || null,
      photoUrl: byline.photo_url || null,
      bio: byline.bio || null,
      profileSetUpAt: byline.profile_set_up_at
        ? new Date(byline.profile_set_up_at)
        : null,
      twitterScreenName: byline.twitter_screen_name || null,
      isGuest: byline.is_guest,
      bestsellerTier: byline.bestseller_tier || null,
    },
  });
}

/**
 * Create or upsert a single PostByline pivot.
 */
async function upsertPostByline(
  postId: string,
  byline: SubstackByline,
): Promise<void> {
  const numericBylineId = parseInt(byline.id, 10);
  if (isNaN(numericBylineId)) return;

  // Because PostByline has an auto-increment ID,
  // we can do a naive create if you don't have a unique constraint
  // that ties (postId, bylineId) to the single pivot record.
  // For safety, you might define a unique constraint in your schema:
  // @@unique([postId, bylineId])
  // Then you can do an upsert.
  // Without that constraint, createMany skipDuplicates might help
  // if you have a composite unique index.
  // For simplicity, do a "check if existing" + "create if not":

  const existing = await prismaArticles.postByline.findFirst({
    where: {
      postId: parseInt(postId, 10),
      bylineId: numericBylineId,
    },
  });
  if (!existing) {
    await prismaArticles.postByline.create({
      data: {
        postId: parseInt(postId, 10),
        bylineId: numericBylineId,
      },
    });
  }
}

/**
 * Upsert a single BylinePublicationUser
 */
async function upsertBylinePublicationUser(
  bpu: SubstackBylinePublicationUser,
  bylineId: string,
): Promise<void> {
  // Substack has an ID as a string. We'll assume that's unique.
  await prismaArticles.bylinePublicationUser.upsert({
    where: { id: bpu.id },
    update: {
      userId: bpu.user_id,
      publicationId: bpu.publication_id,
      role: bpu.role,
      public: bpu.public,
      isPrimary: bpu.is_primary,
      bylineId: bylineId,
    },
    create: {
      id: bpu.id,
      userId: bpu.user_id,
      publicationId: bpu.publication_id,
      role: bpu.role,
      public: bpu.public,
      isPrimary: bpu.is_primary,
      bylineId: bylineId,
    },
  });
}

/**
 * Create an AudioItem. Because it has an auto-increment ID,
 * you typically just create new records for each item.
 * There's no stable unique constraint in your schema
 * (unless you add something like a unique on (postId, audioUrl)).
 */
async function createAudioItem(audio: SubstackAudioItem): Promise<void> {
  await prismaArticles.audioItem.create({
    data: {
      postId: audio.post_id,
      voiceId: audio.voice_id,
      audioUrl: audio.audio_url,
      type: audio.type,
      status: audio.status,
    },
  });
}

/**
 * Create or upsert a single PodcastField record.
 * Because the ID is auto-increment in your schema,
 * we can do a naive create or we can define a unique constraint
 * on `postId` to upsert by postId if that is intended to be 1:1.
 */
async function upsertPodcastField(field: SubstackPodcastFields): Promise<void> {
  // If you have a 1:1 relation to Post,
  // define a unique constraint in your model:
  // @@unique([postId])
  // Then you can do something like:
  const existing = await prismaArticles.podcastField.findFirst({
    where: { postId: field.post_id },
  });
  if (!existing) {
    await prismaArticles.podcastField.create({
      data: {
        postId: field.post_id,
        podcastEpisodeNumber: field.podcast_episode_number,
        podcastSeasonNumber: field.podcast_season_number,
        podcastEpisodeType: field.podcast_episode_type,
        shouldSyndicateToOtherFeed: field.should_syndicate_to_other_feed,
        syndicateToSectionId: field.syndicate_to_section_id || null,
        hideFromFeed: field.hide_from_feed || false,
        freePodcastUrl: field.free_podcast_url || null,
        freePodcastDuration: field.free_podcast_duration || null,
      },
    });
  } else {
    // update
    await prismaArticles.podcastField.update({
      where: { id: existing.id },
      data: {
        podcastEpisodeNumber: field.podcast_episode_number,
        podcastSeasonNumber: field.podcast_season_number,
        podcastEpisodeType: field.podcast_episode_type,
        shouldSyndicateToOtherFeed: field.should_syndicate_to_other_feed,
        syndicateToSectionId: field.syndicate_to_section_id || null,
        hideFromFeed: field.hide_from_feed || false,
        freePodcastUrl: field.free_podcast_url || null,
        freePodcastDuration: field.free_podcast_duration || null,
      },
    });
  }
}

const STEP = 23;

/**
 * Populate a single publication by scraping its posts
 * from Substack and writing to the DB.
 */
export async function populatePublications(
  url: string,
  includeBody = false,
): Promise<Array<{ url: string; status: string }>> {
  const publicationsStatus: Array<{ url: string; status: string }> = [];
  const allPosts: SubstackPost[] = [];

  // Fetch posts in pages (STEP = 23). We attempt up to 1200.
  for (let i = 0; i < 1200; i += STEP) {
    // Rate-limiting measure: after every 600 (i.e. ~26 calls), wait 1 minute
    if (i > 0 && i % 600 === 0) {
      console.log(`Waiting 1 minute after scraping ${i} posts from: ${url}`);
      await delay(60000);
    }

    const subUrl = `${url}/api/v1/archive?sort=new&search=&offset=${i}&limit=${STEP}`;
    const data = await fetchWithHeaders(subUrl);

    if (!data) {
      // If no data, record as failed
      loggerServer.error(`No data for ${subUrl}`);
      break;
    }
    let parsed: SubstackPost[];
    try {
      parsed = JSON.parse(data) as SubstackPost[];
    } catch (err) {
      loggerServer.error(`Failed to parse JSON from ${subUrl}`);
      break;
    }

    if (parsed.length === 0) {
      break;
    }
    allPosts.push(...parsed);
  }

  // Optionally scrape body text for each post
  if (includeBody) {
    for (const post of allPosts) {
      const formattedPost = {
        ...post,
        canonicalUrl: post.canonical_url,
      };
      const body = await getUserArticlesBody([formattedPost]);
      const { canonicalUrl, ...restOfPost } = body[0];
      post.body_text = restOfPost.bodyText;
    }
  }
  debugger;
  try {
    // Wrap all DB operations in a transaction
    await prismaArticles.$transaction(async tx => {
      for (const post of allPosts) {
        const {
          post: postData,
          bylines,
          audioItems,
          podcastFields,
        } = convertPostsToDbRows(post);

        // 1) Upsert Post
        await tx.post.upsert({
          where: { id: postData.id },
          update: {
            ...postData,
            reactions: postData.reactions as any,
            bodyJson: postData.bodyJson as any,
            postTags: postData.postTags as any,
            reaction: postData.reaction as any,
            podcastEpisodeImageInfo: postData.podcastEpisodeImageInfo as any,
          },
          create: {
            ...postData,
            reactions: postData.reactions as any,
            bodyJson: postData.bodyJson as any,
            postTags: postData.postTags as any,
            reaction: postData.reaction as any,
            podcastEpisodeImageInfo: postData.podcastEpisodeImageInfo as any,
          },
        });

        // 2) Upsert Bylines and related data
        if (bylines.length > 0) {
          for (const byline of bylines) {
            const numericBylineId = parseInt(byline.id, 10);
            if (isNaN(numericBylineId)) continue;

            await tx.byline.upsert({
              where: { id: numericBylineId },
              update: {
                name: byline.name,
                handle: byline.handle,
                previousName: byline.previous_name || null,
                photoUrl: byline.photo_url || null,
                bio: byline.bio || null,
                profileSetUpAt: byline.profile_set_up_at
                  ? new Date(byline.profile_set_up_at)
                  : null,
                twitterScreenName: byline.twitter_screen_name || null,
                isGuest: byline.is_guest,
                bestsellerTier: byline.bestseller_tier || null,
              },
              create: {
                id: numericBylineId,
                name: byline.name,
                handle: byline.handle,
                previousName: byline.previous_name || null,
                photoUrl: byline.photo_url || null,
                bio: byline.bio || null,
                profileSetUpAt: byline.profile_set_up_at
                  ? new Date(byline.profile_set_up_at)
                  : null,
                twitterScreenName: byline.twitter_screen_name || null,
                isGuest: byline.is_guest,
                bestsellerTier: byline.bestseller_tier || null,
              },
            });

            const existing = await tx.postByline.findFirst({
              where: {
                postId: parseInt(postData.id, 10),
                bylineId: numericBylineId,
              },
            });

            if (!existing) {
              await tx.postByline.create({
                data: {
                  postId: parseInt(postData.id, 10),
                  bylineId: numericBylineId,
                },
              });
            }

            if (byline.publicationUsers && byline.publicationUsers.length > 0) {
              for (const bpu of byline.publicationUsers) {
                await tx.bylinePublicationUser.upsert({
                  where: { id: bpu.id },
                  update: {
                    userId: bpu.user_id,
                    publicationId: bpu.publication_id,
                    role: bpu.role,
                    public: bpu.public,
                    isPrimary: bpu.is_primary,
                    bylineId: numericBylineId.toString(),
                  },
                  create: {
                    id: bpu.id,
                    userId: bpu.user_id,
                    publicationId: bpu.publication_id,
                    role: bpu.role,
                    public: bpu.public,
                    isPrimary: bpu.is_primary,
                    bylineId: numericBylineId.toString(),
                  },
                });
              }
            }
          }
        }

        // 3) AudioItems
        if (audioItems.length > 0) {
          for (const audio of audioItems) {
            await tx.audioItem.create({
              data: {
                postId: audio.post_id,
                voiceId: audio.voice_id,
                audioUrl: audio.audio_url,
                type: audio.type,
                status: audio.status,
              },
            });
          }
        }

        // 4) PodcastFields
        if (podcastFields) {
          const existing = await tx.podcastField.findFirst({
            where: { postId: podcastFields.post_id },
          });

          if (existing) {
            await tx.podcastField.update({
              where: { id: existing.id },
              data: {
                podcastEpisodeNumber: podcastFields.podcast_episode_number,
                podcastSeasonNumber: podcastFields.podcast_season_number,
                podcastEpisodeType: podcastFields.podcast_episode_type,
                shouldSyndicateToOtherFeed:
                  podcastFields.should_syndicate_to_other_feed,
                syndicateToSectionId:
                  podcastFields.syndicate_to_section_id || null,
                hideFromFeed: podcastFields.hide_from_feed || false,
                freePodcastUrl: podcastFields.free_podcast_url || null,
                freePodcastDuration:
                  podcastFields.free_podcast_duration || null,
              },
            });
          } else {
            await tx.podcastField.create({
              data: {
                postId: podcastFields.post_id,
                podcastEpisodeNumber: podcastFields.podcast_episode_number,
                podcastSeasonNumber: podcastFields.podcast_season_number,
                podcastEpisodeType: podcastFields.podcast_episode_type,
                shouldSyndicateToOtherFeed:
                  podcastFields.should_syndicate_to_other_feed,
                syndicateToSectionId:
                  podcastFields.syndicate_to_section_id || null,
                hideFromFeed: podcastFields.hide_from_feed || false,
                freePodcastUrl: podcastFields.free_podcast_url || null,
                freePodcastDuration:
                  podcastFields.free_podcast_duration || null,
              },
            });
          }
        }
      }
    });

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
export async function setPublications(
  req?: { body?: { url?: string } },
  includeBody = false,
): Promise<void> {
  // If we have a request body with a url, just run on that
  if (req && req.body && req.body.url) {
    let { url } = req.body;
    url = toValidUrl(url);
    const publicationsStatus = await populatePublications(url, includeBody);
    return;
  }

  // Otherwise, process in a loop from the publication_links table
  while (true) {
    console.log("Getting publications to process (limit 500)");

    // 1) Get up to 500 links with null status
    const linksToProcess = await prismaArticles.publicationLink.findMany({
      where: { status: null },
      take: 500,
    });

    if (linksToProcess.length === 0) {
      console.log("No more publications to process.");
      break;
    }

    // 2) Mark them as started
    await prismaArticles.publicationLink.updateMany({
      where: {
        id: { in: linksToProcess.map(link => link.id) },
      },
      data: { startedAt: new Date() },
    });

    let index = 0;
    let runningTasks = 0;
    const maxRunningTasks = 1;

    const doProcessLink = async (link: PublicationLink, i: number) => {
      try {
        const statusArray = await populatePublications(link.url);
        console.log(`Processed ${i + 1}/${linksToProcess.length}: ${link.url}`);

        // Build updates for each publication in statusArray
        for (const status of statusArray) {
          await prismaArticles.publicationLink.update({
            where: { id: link.id },
            data: {
              completedAt: status.status === "completed" ? new Date() : null,
              status: status.status,
            },
          });
        }
      } catch (error: any) {
        console.error(`Failed to process ${link.url}:`, error);
        loggerServer.error(`Failed to process ${link.url}:`, error);
      } finally {
        runningTasks--;
      }
    };

    // 3) Loop through each link
    while (index < linksToProcess.length) {
      // Wait if we've hit the max running tasks
      if (runningTasks >= maxRunningTasks) {
        await delay(500);
        continue;
      }
      const link = linksToProcess[index];
      index++;
      runningTasks++;

      // Fire & forget
      void doProcessLink(link, index - 1);
    }

    // 4) Wait for all tasks to finish
    while (runningTasks > 0) {
      await delay(100);
    }

    // 5) Finally, mark them as completed_at if status updated
    console.log("All publications processed in this batch.");
  }
}
