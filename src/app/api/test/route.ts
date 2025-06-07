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
  generateScheduleNoteMissedEmail,
  generateSubstackDownEmail,
  generateWelcomeTemplateTrial,
} from "@/lib/mail/templates";
import { prisma, prismaArticles } from "@/lib/prisma";
import { searchSimilarArticles } from "@/lib/dal/milvus";
import { Note, NoteStatus } from "@prisma/client";
import { getStripeInstance } from "@/lib/stripe";
import { bigint } from "zod";
import { getBylineByUserId } from "@/lib/dal/byline";
import { fetchAuthor } from "@/lib/utils/lambda";
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
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.meta) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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

  return NextResponse.json({ success: true });

  // const notesNotPostedTemplate = generateManyNotesMissedEmail("Orel");
  // await sendMailSafe({
  //   to: "orelsmail@gmail.com",
  //   from: "support",
  //   subject: notesNotPostedTemplate.subject,
  //   template: notesNotPostedTemplate.body,
  // });
}
