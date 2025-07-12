import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { NextRequest, NextResponse } from "next/server";
import {
  addSubscriber,
  addTagToEmail,
  addTagToManyEmails,
  getUsersFromDate,
  sendMailSafe,
} from "@/lib/mail/mail";
import {
  generateManyNotesMissedEmail,
  generatePublicationAnalysisCompleteEmail,
  generateRegistrationNotCompletedDiscountEmail,
  generateScheduleNoteMissedEmail,
  generateSubstackDownEmail,
  generateWelcomeTemplateTrial,
} from "@/lib/mail/templates";
import { prisma, prismaArticles, prismaProd } from "@/lib/prisma";
import { searchSimilarArticles } from "@/lib/dal/milvus";
import { Note, NoteStatus, User } from "@prisma/client";
import { getStripeInstance, shouldApplyRetentionCoupon } from "@/lib/stripe";
import { bigint } from "zod";
import { getBylineByUserId } from "@/lib/dal/byline";
import { fetchAuthor } from "@/lib/utils/lambda";

// dumpSlackEmails.ts
// Run with:  node --env-file=.env dumpSlackEmails.ts  (Node 20+ has native fetch)
// .env should contain:
//   SLACK_TOKEN=xoxc-xxxxxxxxxxxxxxxxxxxxxxxx
//   SLACK_COOKIES=utm=%7B%7D; b=...; d=....   (everything after “cookie:” in your own request)

import fs from "node:fs/promises";
import { addTopics } from "@/lib/dal/topics";

const WORKSPACE_ID = "T05NYCU89K4"; // leave as-is unless you’re on another org
const CHANNEL_ID = "C05NVFBU077"; // change to the channel you care about
const TOKEN =
  "xoxc-5780436281650-8876189816469-9086462224421-3e60fa6572b19255cab314dbd3588259833fe3f4528d57bceec75b324289c849";
const COOKIES = `utm=%7B%7D; b=.8d81e809e676fffcc00f09c1bccc0fdf; shown_ssb_redirect_page=1; ssb_instance_id=32a73835-a4b9-449f-83ba-b1c75031494c; cjConsent=MHxOfDB8Tnww; cjUser=88cd4483-5f0d-4af3-b71b-f4e0cfddf08b; _cs_c=0; _clck=1g14hwb%7C2%7Cfw4%7C0%7C1968; _ga=GA1.1.1273036061.1747934258; d-s=1750661345; x=8d81e809e676fffcc00f09c1bccc0fdf.1750661345; PageCount=2; _cs_cvars=%7B%7D; _cs_id=2f0e6ec6-da7e-ae70-da24-0d93e31204a2.1747934257.3.1750661999.1750661999.1.1782098257132.1.x; _ga_QTJQME5M5D=GS2.1.s1750661999$o3$g0$t1750661999$j60$l0$h0; _gcl_au=1.1.994749767.1747934258.2115733602.1750662001.1750662007; ec=enQtOTA4MjAzNjU1MjE2Ni1kYTNkODVkMTU5NzFlZjljMzQ5YWMyNGJhZTE2NDg5ODU3Y2M2MjZhNWY5MDJkYTI5NjZlN2QzNWExODBlMmM5; lc=1750662031; OptanonConsent=isGpcEnabled=0&datestamp=Mon+Jun+23+2025+10%3A00%3A33+GMT%2B0300+(Israel+Daylight+Time)&version=202402.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&consentId=b9cb107e-e729-4157-a682-6e0873fed3e2&interactionCount=1&isAnonUser=1&landingPath=NotLandingPage&groups=1%3A1%2C3%3A1%2C2%3A1%2C4%3A1&AwaitingReconsent=false; shown_download_ssb_modal=1; show_download_ssb_banner=1; no_download_ssb_banner=1; d=xoxd-hosU2q0PLxk%2FP%2BbS8Kigs62Lc%2B%2FpsdXjgvteEa4VfKBq93MEkYKzgQM9mZEoLaN%2FLcKYTtpMPQdjgCZnMzep2uSsfq4AUi8RisqrYQmny4UloZjrytU1aFw8aciQ1bzuneosLUjXERf73NgKqJS474LQB4IrDOJo%2BOJvodUYH7Alt92IF%2BRd%2BRBJ%2FFgdfeBhsLAxcXF2Q0ZBPNF2tfSNwiIFo4dw; tz=180; web_cache_last_updated2363ab2545063fe866c33a474aae911b=1750662046822; _cs_s=1.5.0.9.1750663859959`;

type SlackUser = {
  id: string;
  name: string;
  profile: { email?: string; real_name?: string };
};

async function fetchBatch(marker: string | null): Promise<{
  members: SlackUser[];
  nextMarker: string | null;
}> {
  const body: any = {
    token: TOKEN,
    include_profile_only_users: true,
    count: 50,
    channels: [CHANNEL_ID],
    filter: "people",
    index: "users_by_display_name",
    locale: "en-US",
    present_first: false,
    fuzz: 1,
  };
  if (marker) body.marker = marker;

  const res = await fetch(
    `https://edgeapi.slack.com/cache/${WORKSPACE_ID}/users/list?_x_app_name=client&fp=64&_x_num_retries=0`,
    {
      method: "POST",
      headers: {
        "content-type": "text/plain;charset=UTF-8",
        cookie: COOKIES,
        accept: "*/*",
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    throw new Error(`Slack puked ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return {
    members: (json.results || []) as SlackUser[],
    nextMarker: json.next_marker ?? null,
  };
}

async function dumpSlackEmails() {
  let marker: string | null = null;
  const everyone: SlackUser[] = [];
  console.log("Starting the roundup…");

  do {
    const { members, nextMarker } = await fetchBatch(marker);
    console.log(`Fetched ${members.length} users`);
    everyone.push(...members);
    marker = nextMarker;
  } while (marker);

  // Strip to what you want
  const emails = everyone;
  // .filter(u => u.profile?.email)
  // .map(u => ({
  //   id: u.id,
  //   name: u.profile.real_name || u.name,
  //   email: u.profile.email!,
  // }));

  await fs.writeFile("emails.json", JSON.stringify(emails, null, 2));
  console.log(`Saved ${emails.length} emails to emails.json`);
}

// async function processUser(userId: string) {
//   try {
//     const userMetadata = await prisma.userMetadata.findUnique({
//       where: { userId },
//       include: { publication: true },
//     });

//     const publicationMetadata = userMetadata?.publication;

//     if (!publicationMetadata) {
//       console.log(`No publication found for user ${userId}`);
//       return;
//     }

//     const generatedDescriptionForSearch = await runPrompt(
//       generateVectorSearchOptimizedDescriptionPrompt(publicationMetadata),
//       "anthropic/claude-3.7-sonnet",
//     );

//     const parsedGeneratedDescriptionForSearch = await parseJson<{
//       optimizedDescription: string;
//     }>(generatedDescriptionForSearch);

//     await prisma.publicationMetadata.update({
//       where: { id: publicationMetadata.id },
//       data: {
//         generatedDescriptionForSearch:
//           parsedGeneratedDescriptionForSearch.optimizedDescription,
//       },
//     });

//     console.log(`Successfully processed user ${userId}`);
//   } catch (error) {
//     console.error(`Error processing user ${userId}:`, error);
//   }
// }\

// async function processBatch(userIds: string[]) {
//   return Promise.all(userIds.map(userId => processUser(userId)));
// }

export async function GET(request: NextRequest) {
  // const session = await getServerSession(authOptions);

  // const subscription = await prisma.subscription.findMany({
  //   where: {
  //     stripeSubId: "sub_1RTJ5xRxhYQDfRYGstLlP9tU",
  //   },
  // });
  // const usersApplied: Record<string, Partial<User> & { applied: boolean }> = {};
  // for (const sub of subscription) {
  //   const apply = await shouldApplyRetentionCoupon(sub.userId);
  //   usersApplied[sub.userId] = {
  //     ...sub,
  //     applied: apply,
  //   };
  // }
  // await fs.writeFile(
  //   "usersApplied.json",
  //   JSON.stringify(usersApplied, null, 2),
  // );
  // console.log(
  //   `Saved ${Object.keys(usersApplied).length} users to usersApplied.json`,
  // );

  const topics = await prismaProd.publicationMetadata.findMany({
    select: {
      topics: true,
      preferredTopics: true,
    },
  });

  const topicsToAdd = topics.map(topic => topic.topics).join(",");
  const preferredTopicsToAdd = topics
    .map(topic => topic.preferredTopics)
    .join(",");

  // remove emptys, then join by comma
  const allTopics = [topicsToAdd, preferredTopicsToAdd]
    .flat()
    .filter(topic => topic !== "")
    .map(topic => topic.trim())
    .join(",")
    // remove consecutive commas
    .replace(/,+/g, ",")
    // remove duplicates by name.toLowerCase()
    .split(",")
    .map(topic => topic.trim())
    .join(",");

  const topicsByOccurence: Record<string, number> = {};
  for (const topic of allTopics.split(",")) {
    topicsByOccurence[topic.toLowerCase()] =
      (topicsByOccurence[topic.toLowerCase()] || 0) + 1;
  }

  const sortedTopics = Object.entries(topicsByOccurence)
    .sort((a, b) => b[1] - a[1])
    .map(([topic, count]) => ({
      topic: topic.replace(/\b\w/g, char => char.toUpperCase()),
      count,
    }))
    .slice(0, 300);
  // Uppercase first letter of each word

  // await addTopics(allTopics);

  // const TOPICS = [
  //   "Productivity",
  //   "Mindset",
  //   "Leadership",
  //   "Startups",
  //   "Freelancing",
  //   "Writing",
  //   "Fitness",
  //   "Nutrition",
  //   "Sleep",
  //   "Habits",
  //   "Discipline",
  //   "Focus",
  //   "Creativity",
  //   "Branding",
  //   "Sales",
  //   "Marketing",
  //   "Copywriting",
  //   "Negotiation",
  //   "Cold Outreach",
  //   "SaaS",
  //   "Bootstrapping",
  //   "Solopreneurship",
  //   "Investing",
  //   "Crypto",
  //   "Real Estate",
  //   "Coding",
  //   "AI Tools",
  //   "UX Design",
  //   "Web Design",
  //   "Psychology",
  //   "Philosophy",
  //   "Relationships",
  //   "Dating",
  //   "Networking",
  //   "Public Speaking",
  //   "Storytelling",
  //   "Education",
  //   "Parenting",
  //   "Remote Work",
  //   "Side Hustles",
  //   "Passive Income",
  //   "Burnout",
  //   "Mental Health",
  //   "Journaling",
  //   "Note-taking",
  //   "Second Brain",
  //   "Learning",
  //   "Reading",
  //   "Books",
  //   "Newsletters",
  //   "SEO",
  //   "Email Marketing",
  //   "Paid Ads",
  //   "Automation",
  //   "Delegation",
  //   "Time Management",
  //   "Calendars",
  //   "Frameworks",
  //   "Prioritization",
  //   "Decision Making",
  //   "Data Science",
  //   "Machine Learning",
  //   "APIs",
  //   "Open Source",
  //   "Indie Hacking",
  //   "Career Advice",
  //   "Job Hunting",
  //   "Interviewing",
  //   "Resume Tips",
  //   "Online Courses",
  //   "Community Building",
  //   "Monetization",
  //   "Subscriptions",
  //   "Personal Finance",
  //   "Budgeting",
  //   "Productivity Tools",
  //   "Health Tech",
  //   "Biohacking",
  //   "Supplements",
  //   "Minimalism",
  //   "Stoicism",
  //   "Religion",
  //   "Politics",
  //   "Current Events",
  //   "War",
  //   "Culture",
  //   "Travel",
  //   "Immigration",
  //   "Language Learning",
  //   "Content Creation",
  //   "YouTube",
  //   "Podcasting",
  //   "Substack",
  //   "Design Systems",
  //   "Fashion",
  //   "Tech Reviews",
  //   "Hardware",
  //   "Software",
  //   "Digital Nomads",
  //   "Israel",
  //   "U.S. Politics",
  //   "Risk-Taking",
  //   "Goal Setting",
  //   "Mindfulness",
  //   "Meditation",
  //   "Self Awareness",
  //   "Life Lessons",
  //   "Growth Hacks",
  //   "Analytics",
  //   "Finance Tools",
  //   "Sales Funnels",
  //   "Funnel Building",
  //   "Customer Support",
  //   "User Feedback",
  //   "Early Users",
  //   "Launch Strategy",
  //   "Pricing Strategy",
  //   "Pitching",
  //   "Fundraising",
  //   "Venture Capital",
  //   "Angel Investing",
  //   "No-Code",
  //   "Low-Code",
  //   "JavaScript",
  //   "TypeScript",
  //   "React",
  //   "Next.js",
  //   "TailwindCSS",
  //   "Design Thinking",
  //   "Product Design",
  //   "Product Strategy",
  //   "Startup Ideas",
  //   "Idea Validation",
  //   "Pain Points",
  //   "Problem Solving",
  //   "Rapid Prototyping",
  //   "Daily Routines",
  //   "Motivation",
  //   "Willpower",
  //   "Learning Models",
  //   "Attention Span",
  //   "Distractions",
  //   "Focus Tools",
  //   "Cold Emails",
  //   "Landing Pages",
  //   "Conversion Rates",
  //   "Affiliate Marketing",
  //   "Networking Events",
  //   "Solo Travel",
  //   "Tech Stacks",
  //   "Side Projects",
  //   "Remote Teams",
  //   "Hiring",
  //   "Firing",
  //   "Scaling Up",
  //   "Downsizing",
  //   "Recession",
  //   "Product Launches",
  //   "Weekly Planning",
  //   "Burn Rate",
  //   "Profit Margins",
  //   "User Retention",
  //   "Feedback Loops",
  //   "Community Growth",
  //   "Virality",
  //   "Churn Rate",
  //   "Niche Audiences",
  //   "Content Strategy",
  // ];

  // await addTopics(sortedTopics);

  const template = generateWelcomeTemplateTrial("Orel");
  await sendMailSafe({
    to: "orelsmail@gmail.com",
    from: "welcome",
    subject: template.subject,
    template: template.body,
  });

  return NextResponse.json({ success: true, sortedTopics });

  // if (!session || !session.user || !session.user.meta) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }
  // const batchSize = 100000;
  // let deletedRows = 0;
  // let totalDeletedRows = 0;
  // let now = new Date();
  // do {
  //   deletedRows = await prismaArticles.$executeRawUnsafe(`
  //   WITH ranked AS (
  //     SELECT
  //       id,
  //       ROW_NUMBER() OVER (
  //         PARTITION BY post_id, byline_id
  //         ORDER BY id
  //       ) AS rn
  //     FROM post_bylines
  //   )
  //   DELETE FROM post_bylines
  //   WHERE id IN (
  //     SELECT id FROM ranked WHERE rn > 1 LIMIT ${batchSize}
  //   );
  // `);

  //   console.log(`Deleted ${deletedRows} duplicate rows...`);
  //   totalDeletedRows += deletedRows;
  //   console.log(`Total deleted rows: ${totalDeletedRows}`);
  //   const timeToDelete = new Date().getTime() - now.getTime();
  //   console.log(`Time to delete: ${timeToDelete}ms`);
  //   now = new Date();
  // } while (deletedRows > 0);
  // const userId = "6822f9d5d029b4c9c504c185";
  // const apply = await shouldApplyRetentionCoupon(userId);
  // return NextResponse.json({ apply });

  // const allNotesStats = await prismaArticles.notesCommentsStats.findMany({
  //   where: {
  //     notePostedAt: null,
  //   },
  // });
  // const notesForStats = await prismaArticles.notesComments.findMany({
  //   where: {
  //     commentId: {
  //       in: allNotesStats.map(stat => stat.commentId),
  //     },
  //   },
  // });

  // // add notePostedAt to allNotesStats
  // const allNotesStatsWithNotePostedAt = allNotesStats.map(stat => {
  //   const note = notesForStats.find(note => note.commentId === stat.commentId);
  //   return {
  //     ...stat,
  //     notePostedAt: note?.timestamp,
  //   };
  // });

  // // update allNotesStats with notePostedAt
  // // update in batches of 100
  // let index = 0;
  // const batchSize = 30;
  // for (let i = 0; i < allNotesStatsWithNotePostedAt.length; i += batchSize) {
  //   console.log(
  //     `Updating batch ${index} of ${allNotesStatsWithNotePostedAt.length}`,
  //   );
  //   const batch = allNotesStatsWithNotePostedAt.slice(i, i + batchSize);
  //   await Promise.all(
  //     batch.map(stat =>
  //       prismaArticles.notesCommentsStats.update({
  //         where: { id: stat.id },
  //         data: { notePostedAt: stat.notePostedAt },
  //       }),
  //     ),
  //   );
  //   index += batchSize;
  // }

  // const notesWithOver300Likes = await prismaArticles.notesComments.findMany({
  //   where: {
  //     reactionCount: {
  //       gt: 300,
  //     },
  //   },
  //   select: {
  //     body: true,
  //   },
  // });

  // const buckets = {
  //   total: 0,
  //   lt_50: 0,
  //   _50_99: 0,
  //   _100_149: 0,
  //   _150_199: 0,
  //   _200_239: 0,
  //   _240_279: 0,
  //   _280_299: 0,
  //   _300_349: 0,
  //   _350_399: 0,
  //   _400_plus: 0,
  // };

  // for (const note of notesWithOver300Likes) {
  //   const len = note.body.length;
  //   buckets.total++;

  //   if (len < 50) buckets.lt_50++;
  //   else if (len < 100) buckets._50_99++;
  //   else if (len < 150) buckets._100_149++;
  //   else if (len < 200) buckets._150_199++;
  //   else if (len < 240) buckets._200_239++;
  //   else if (len < 280) buckets._240_279++;
  //   else if (len < 300) buckets._280_299++;
  //   else if (len < 350) buckets._300_349++;
  //   else if (len < 400) buckets._350_399++;
  //   else buckets._400_plus++;
  // }

  // console.table(
  //   Object.entries(buckets).map(([range, count]) => ({
  //     range,
  //     count,
  //     percent: ((count / buckets.total) * 100).toFixed(2) + "%",
  //   })),
  // );

  // const searchParams = request.nextUrl.searchParams;

  // const range = searchParams.get("range") || "2weeks";
  // const customStartDate = searchParams.get("startDate");
  // const customEndDate = searchParams.get("endDate");

  // // Calculate date range based on preset or custom dates
  // const now = new Date();
  // let startDate: Date;
  // let endDate: Date = now;

  // if (customStartDate && customEndDate) {
  //   startDate = new Date(customStartDate);
  //   endDate = new Date(customEndDate);
  // } else {
  //   switch (range) {
  //     case "week":
  //       startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  //       break;
  //     case "2weeks":
  //       startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  //       break;
  //     case "month":
  //       startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  //       break;
  //     case "3months":
  //       startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  //       break;
  //     default:
  //       startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  //   }
  // }

  // // Get all users with their notes and scheduling data within the date range
  // const users = await prisma.user.findMany({
  //   include: {
  //     userMetadata: true,
  //     notes: {
  //       where: {
  //         scheduledTo: {
  //           lte: endDate,
  //           gte: startDate,
  //           not: null,
  //         },
  //         isArchived: false,
  //       },
  //       orderBy: {
  //         scheduledTo: "desc",
  //       },
  //     },
  //   },
  // });

  // // Calculate hit rates and time series data for each user
  // const userHitRateData = users
  //   .filter(user => user.notes.length > 0) // Only users with scheduled notes
  //   .map(user => {
  //     const totalScheduledNotes = user.notes.length;
  //     const sentNotes = user.notes.filter(
  //       note => note.sentViaScheduleAt !== null,
  //     );
  //     const hitRate =
  //       totalScheduledNotes > 0
  //         ? (sentNotes.length / totalScheduledNotes) * 100
  //         : 0;

  //     // Group notes by week for time series data
  //     const weeklyData: {
  //       [key: string]: { scheduled: number; sent: number };
  //     } = {};

  //     user.notes.forEach(note => {
  //       if (note.scheduledTo) {
  //         const weekStart = new Date(note.scheduledTo);
  //         weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
  //         const weekKey = weekStart.toISOString().split("T")[0];

  //         if (!weeklyData[weekKey]) {
  //           weeklyData[weekKey] = { scheduled: 0, sent: 0 };
  //         }

  //         weeklyData[weekKey].scheduled += 1;
  //         if (note.sentViaScheduleAt) {
  //           weeklyData[weekKey].sent += 1;
  //         }
  //       }
  //     });

  //     // Convert to array and calculate weekly hit rates
  //     const timeSeriesData = Object.entries(weeklyData)
  //       .map(([week, data]) => ({
  //         week,
  //         hitRate: data.scheduled > 0 ? (data.sent / data.scheduled) * 100 : 0,
  //         scheduled: data.scheduled,
  //         sent: data.sent,
  //       }))
  //       .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
  //       .slice(-12); // Last 12 weeks

  //     return {
  //       id: user.id,
  //       name: user.name || "Unknown User",
  //       email: user.email || "",
  //       image: user.image || null,
  //       totalScheduledNotes,
  //       sentNotes: sentNotes.length,
  //       hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
  //       timeSeriesData,
  //       lastScheduledAt: user.notes[0]?.scheduledTo || null,
  //       plan: user.userMetadata?.[0]?.plan || null,
  //     };
  //   })
  //   .sort((a, b) => b.hitRate - a.hitRate); // Sort by hit rate descending

  // // Users with more than 20 notes schedules and hit rate less than 50%
  // const usersToNotify = userHitRateData.filter(user => user.hitRate < 50);

  // // for (const user of usersToNotify) {
  //   // const template = generateManyNotesMissedEmail("Stacy Jagodowski");
  //   // await sendMailSafe({
  //   //   to: "sejago@gmail.com",
  //   //   from: "support",
  //   //   subject: template.subject,
  //   //   template: template.body,
  //   // });
  // //   const template1 = generateManyNotesMissedEmail("Burke");
  // //   await sendMailSafe({
  // //     to: "fsburke@fsbassociates.com",
  // //     from: "support",
  // //     subject: template1.subject,
  // //     template: template1.body,
  // //   });
  // // // }

  await dumpSlackEmails();

  return NextResponse.json({ success: true });

  // const notesNotPostedTemplate = generateManyNotesMissedEmail("Orel");
  // await sendMailSafe({
  //   to: "orelsmail@gmail.com",
  //   from: "support",
  //   subject: notesNotPostedTemplate.subject,
  //   template: notesNotPostedTemplate.body,
  // });
}
