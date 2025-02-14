// main.ts
/* eslint-disable no-console */
import * as cheerio from "cheerio";
import { prismaArticles } from "@/app/api/_db/db";
import {
  Post,
  Publication,
  PublicationLink,
} from "../../../prisma/generated/articles";
import { delay, fetchWithHeaders } from "./requests";
import loggerServer from "@/loggerServer";
import { getUserArticlesBody } from "@/lib/dal/articles";
import { toValidUrl } from "@/lib/utils/url";

export const getArticleEndpoint = (url: string, offset: number, limit: number) => {
  return `${url}/api/v1/archive?sort=new&search=&offset=${offset}&limit=${limit}`;
};

interface SubstackPublication {
  id: number;
  name: string;
  subdomain: string;
  custom_domain: string;
  custom_domain_optional: boolean;
  hero_text: string;
  logo_url: string;
  email_from_name: string;
  copyright: string;
  founding_plan_name: string;
  community_enabled: boolean;
  invite_only: boolean;
  payments_state: string;
  language: string;
  explicit: boolean;
  is_personal_mode: boolean;
  created_at: string;
  rss_website_url: string;
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
  publication: SubstackPublication;
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
  publication_id: number;
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
function convertPostsToDbRows(posts: SubstackPost): {
  post: Post;
  bylines: any;
  audioItems: any;
  podcastFields: any;
} {
  // We'll map out only the data that matches your schema
  return {
    post: {
      id: posts.id,
      publicationId: posts.publication_id.toString(), // Potential mismatch if not numeric
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
    podcastFields: posts.podcastFields ?? [],
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
        name: publication?.name || "Unknown",
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
  includeBody = false,
  maxArticlesToGetBody = 60,
): Promise<Array<{ url: string; status: string }>> {
  const publicationsStatus: Array<{ url: string; status: string }> = [];
  const allPosts: SubstackPost[] = [];

  // STEP is 23, we attempt up to 1200 posts
  for (let i = 0; i < 1200; i += STEP) {
    // Rate limit: after every 600 (26 calls), wait 1 minute
    if (i > 0 && i % 600 === 0) {
      console.log(`Waiting 1 minute after scraping ${i} posts from: ${url}`);
      await delay(60000);
    }

    const subUrl = getArticleEndpoint(url, i, STEP);
    const data = await fetchWithHeaders(subUrl);
    if (!data || data.length === 0) {
      loggerServer.error(`No data for ${subUrl}`);
      break;
    }
    allPosts.push(...data);
  }

  // Optionally scrape body text for each post
  if (includeBody) {
    const postsToGetBody = allPosts.slice(0, maxArticlesToGetBody);
    for (const post of postsToGetBody) {
      const formattedPost = {
        ...post,
        canonicalUrl: post.canonical_url,
      };
      const body = await getUserArticlesBody([formattedPost]);
      const { canonicalUrl, ...restOfPost } = body[0];
      post.body_text = restOfPost.bodyText;
    }
  }

  // Extract publications from allPosts
  const publications = extractPublications(allPosts);

  try {
    // 1) Insert ALL Posts First
    for (const post of allPosts) {
      const { post: postData } = convertPostsToDbRows(post);
      const countPosts = await prismaArticles.post.upsert({
        where: { id: postData.id.toString() },
        update: {
          ...postData,
          id: postData.id.toString(),
          reactions: postData.reactions as any,
          bodyJson: postData.bodyJson as any,
          postTags: postData.postTags as any,
          reaction: postData.reaction as any,
          podcastEpisodeImageInfo: postData.podcastEpisodeImageInfo as any,
        },
        create: {
          ...postData,
          id: postData.id.toString(),
          reactions: postData.reactions as any,
          bodyJson: postData.bodyJson as any,
          postTags: postData.postTags as any,
          reaction: postData.reaction as any,
          podcastEpisodeImageInfo: postData.podcastEpisodeImageInfo as any,
        },
      });
      console.log(`Inserted ${countPosts} posts`);
    }

    // 2) Insert ALL Publications Next
    for (const publication of publications) {
      const countPublications = await prismaArticles.publication.upsert({
        where: { id: publication.id },
        update: { ...publication },
        create: { ...publication },
      });
      console.log(`Inserted ${countPublications} publications`);
    }

    // 3) Bylines, AudioItems, and PodcastFields
    // for (const post of allPosts) {
    //   const {
    //     post: postData,
    //     bylines,
    //     audioItems,
    //     podcastFields,
    //   } = convertPostsToDbRows(post);

      
    //   // Audio Items
    //   // if (audioItems.length > 0) {
    //   //   for (const audio of audioItems) {
    //   //     const countAudioItems = await prismaArticles.audioItem.create({
    //   //       data: {
    //   //         id: audio.id,
    //   //         postId: audio.post_id,
    //   //         voiceId: audio.voice_id.toString(),
    //   //         audioUrl: audio.audio_url,
    //   //         type: audio.type,
    //   //         status: audio.status,
    //   //       },
    //   //     });
    //   //     console.log(`Inserted ${countAudioItems} audioItems`);
    //   //   }

    //   //   // Podcast Fields
    //   //   if (podcastFields) {
    //   //     const existingPodcast = await prismaArticles.podcastField.findFirst({
    //   //       where: { postId: podcastFields.post_id },
    //   //     });
    //   //     if (existingPodcast) {
    //   //       const countPodcastFields = await prismaArticles.podcastField.update(
    //   //         {
    //   //           where: { id: existingPodcast.id },
    //   //           data: {
    //   //             podcastEpisodeNumber: podcastFields.podcast_episode_number,
    //   //             podcastSeasonNumber: podcastFields.podcast_season_number,
    //   //             podcastEpisodeType: podcastFields.podcast_episode_type,
    //   //             shouldSyndicateToOtherFeed:
    //   //               podcastFields.should_syndicate_to_other_feed,
    //   //             syndicateToSectionId:
    //   //               podcastFields.syndicate_to_section_id || null,
    //   //             hideFromFeed: podcastFields.hide_from_feed || false,
    //   //             freePodcastUrl: podcastFields.free_podcast_url || null,
    //   //             freePodcastDuration:
    //   //               podcastFields.free_podcast_duration || null,
    //   //           },
    //   //         },
    //   //       );
    //   //       console.log(`Inserted ${countPodcastFields} podcastFields`);
    //   //     } else {
    //   //       const countPodcastFields = await prismaArticles.podcastField.create(
    //   //         {
    //   //           data: {
    //   //             postId: podcastFields.post_id,
    //   //             podcastEpisodeNumber: podcastFields.podcast_episode_number,
    //   //             podcastSeasonNumber: podcastFields.podcast_season_number,
    //   //             podcastEpisodeType: podcastFields.podcast_episode_type,
    //   //             shouldSyndicateToOtherFeed:
    //   //               podcastFields.should_syndicate_to_other_feed,
    //   //             syndicateToSectionId:
    //   //               podcastFields.syndicate_to_section_id || null,
    //   //             hideFromFeed: podcastFields.hide_from_feed || false,
    //   //             freePodcastUrl: podcastFields.free_podcast_url || null,
    //   //             freePodcastDuration:
    //   //               podcastFields.free_podcast_duration || null,
    //   //           },
    //   //         },
    //   //       );
    //   //       console.log(`Inserted ${countPodcastFields} podcastFields`);
    //   //     }
    //   //   }

    //   //   // Bylines
    //   //   if (bylines.length > 0) {
    //   //     for (const byline of bylines) {
    //   //       const numericBylineId = parseInt(byline.id, 10);
    //   //       if (isNaN(numericBylineId)) continue;

    //   //       // Upsert Byline
    //   //       const countBylines = await prismaArticles.byline.upsert({
    //   //         where: { id: numericBylineId },
    //   //         update: {
    //   //           id: numericBylineId,
    //   //           name: byline.name,
    //   //           handle: byline.handle,
    //   //           previousName: byline.previous_name || null,
    //   //           photoUrl: byline.photo_url || null,
    //   //           bio: byline.bio || null,
    //   //           profileSetUpAt: byline.profile_set_up_at
    //   //             ? new Date(byline.profile_set_up_at)
    //   //             : null,
    //   //           twitterScreenName: byline.twitter_screen_name || null,
    //   //           isGuest: byline.is_guest,
    //   //           bestsellerTier: byline.bestseller_tier || null,
    //   //         },
    //   //         create: {
    //   //           id: numericBylineId,
    //   //           name: byline.name,
    //   //           handle: byline.handle,
    //   //           previousName: byline.previous_name || null,
    //   //           photoUrl: byline.photo_url || null,
    //   //           bio: byline.bio || null,
    //   //           profileSetUpAt: byline.profile_set_up_at
    //   //             ? new Date(byline.profile_set_up_at)
    //   //             : null,
    //   //           twitterScreenName: byline.twitter_screen_name || null,
    //   //           isGuest: byline.is_guest,
    //   //           bestsellerTier: byline.bestseller_tier || null,
    //   //         },
    //   //       });
    //   //       console.log(`Inserted ${countBylines} bylines`);
    //   //       // Ensure Post-Byline Link
    //   //       const existing = await prismaArticles.postByline.findFirst({
    //   //         where: {
    //   //           postId: parseInt(postData.id, 10),
    //   //           bylineId: numericBylineId,
    //   //         },
    //   //       });

    //   //       if (!existing) {
    //   //         const countPostBylines = await prismaArticles.postByline.create({
    //   //           data: {
    //   //             postId: parseInt(postData.id, 10),
    //   //             bylineId: numericBylineId,
    //   //           },
    //   //         });
    //   //         console.log(`Inserted ${countPostBylines} postBylines`);
    //   //       }

    //   //       // BylinePublicationUser
    //   //       if (byline.publicationUsers && byline.publicationUsers.length > 0) {
    //   //         for (const bpu of byline.publicationUsers) {
    //   //           const countBylinePublicationUsers =
    //   //             await prismaArticles.bylinePublicationUser.upsert({
    //   //               where: { id: bpu.id.toString() },
    //   //               update: {
    //   //                 userId: bpu.user_id.toString(),
    //   //                 publicationId: bpu.publication_id.toString(),
    //   //                 role: bpu.role,
    //   //                 public: bpu.public,
    //   //                 isPrimary: bpu.is_primary,
    //   //                 bylineId: numericBylineId,
    //   //               },
    //   //               create: {
    //   //                 id: bpu.id.toString(),
    //   //                 userId: bpu.user_id.toString(),
    //   //                 publicationId: bpu.publication_id.toString(),
    //   //                 role: bpu.role,
    //   //                 public: bpu.public,
    //   //                 isPrimary: bpu.is_primary,
    //   //                 bylineId: numericBylineId,
    //   //               },
    //   //             });
    //   //           console.log(
    //   //             `Inserted ${countBylinePublicationUsers} bylinePublicationUsers`,
    //   //           );
    //   //         }
    //   //       }
    //   //     }
    //   //   }
    //   // }
    // }

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
  maxArticlesToGetBody = 60,
): Promise<void> {
  // If we have a request body with a url, just run on that
  if (req && req.body && req.body.url) {
    let { url } = req.body;
    url = toValidUrl(url);
    const publicationsStatus = await populatePublications(
      url,
      includeBody,
      maxArticlesToGetBody,
    );
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
