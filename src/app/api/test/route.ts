import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { NextResponse } from "next/server";
import { addTagToEmail, sendMailSafe } from "@/lib/mail/mail";
import { generatePublicationAnalysisCompleteEmail, generateScheduleNoteMissedEmail, generateWelcomeTemplateTrial } from "@/lib/mail/templates";

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
// }

// async function processBatch(userIds: string[]) {
//   return Promise.all(userIds.map(userId => processUser(userId)));
// }

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // // const email = generateWelcomeTemplateTrial("Orel");
  // // const result = await sendMailSafe({
  // //   to: "stefangirard@gmail.com",
  // //   from: "welcome",
  // //   subject: email.subject,
  // //   template: email.body,
  // // });
  // // const result1 = await sendMailSafe({
  // //   to: "sophiafifner@gmail.com",
  // //   from: "welcome",
  // //   subject: email.subject,
  // //   template: email.body,
  // // });
  // const email = generateScheduleNoteMissedEmail(
  //   "Orel",
  //   "68185c39a3e7733daed4fd0c",
  //   "This is a test note",
  //   "This is a test reason",
  // );
  // const result = await sendMailSafe({
  //   to: "orelsmail@gmail.com",
  //   from: "noreply",
  //   subject: email.subject,
  //   template: email.body,
  // });
  // console.log(result);

  // if (!result) {
  //   return NextResponse.json({ error: "Failed to send mail" }, { status: 500 });
  // }
  // const email = generatePublicationAnalysisCompleteEmail();

  // await sendMailSafe({
  //   to: "orelsmail@gmail.com",
  //   from: "noreply",
  //   subject: email.subject,
  //   template: email.body,
  // });

  // await addTagToEmail("orelsmail@gmail.com", "writestack-new-subscriber");

  // try {
  //   const deleteTemplates = generateSubscriptionDeletedEmail("Orel", "Pro");
  //   const freeTrialEndingTemplates = generateFreeSubscriptionEndedEmail("Orel");
  //   const pausedTemplates = generateSubscriptionPausedEmail("Orel", "Pro");
  // const welcomeTemplates = welcomeTemplateTrial("Orel");
  // await sendMail({
  //   to: "orelsmail@gmail.com",
  //   from: "support",
  //   subject: welcomeTemplates.subject,
  //   template: welcomeTemplates.body,
  //   cc: [],
  // });

  // const topNotes = await prismaArticles.notesComments.findMany({
  //   where: {
  //     reactionCount: {
  //       gte: 100,
  //       lte: 2000,
  //     },
  //   },
  //   orderBy: {
  //     reactionCount: "desc",
  //   },
  //   take: 8000,
  // });

  // const allBodys = topNotes.map(note => note.body);
  // const prompt = `
  // Act as a professional copywriter, with 20 years of experience.
  // Your job is to analyze the following notes, ordered by their popularity,
  // and figure out the top 15 templates to write notes.

  // Example for a template:
  // 'Start with what - Explain what you're going to talk about.
  // Continue with Why - Explain why this is important.
  // Then How - A few bullet points on how to do it.'

  // Instructions:
  // - Ignore news notes.
  // - Ignore political notes.
  // - Ignore crypto/stocks/market/money notes.
  // - Ignore notes that are too short and not informative.
  // - Ignore notes that are promotional.
  // - Ignore notes that are looking to connect to other creators.
  // - Ignore notes that are asking for feedback.
  // - Ignore notes that are asking for likes.
  // - Ignore notes that are asking for comments.
  // - Ignore notes that are asking for shares.
  // - Ignore notes that are asking for views.
  // - Ignore notes that are asking for subscribers.
  // - Ignore notes that are asking for donations.

  // Make sure the templates are as generic as possible and as actionable as possible, so that they can be used in any context.

  // Here are the notes, separated by 2 newlines:
  // ${allBodys.join("\n\n")}
  // `;

  // const result = await runPrompt(
  //   [
  //     {
  //       role: "user",
  //       content: prompt,
  //     },
  //   ],
  //   "google/gemini-2.5-pro-preview-03-25",
  // );
  // console.log(result);
  // // write results to a file
  // fs.writeFileSync("result.txt", result);

  //   await sendMail({
  //     to: "orelsmail@gmail.com",
  //     from: "support",
  //     subject: freeTrialEndingTemplates.subject,
  //     template: freeTrialEndingTemplates.body,
  //     cc: [],
  //   });

  //   await sendMail({
  //     to: "orelsmail@gmail.com",
  //     from: "support",
  //     subject: pausedTemplates.subject,
  //     template: pausedTemplates.body,
  //     cc: [],
  //   });
  // const allUserNotes = await prisma.note.findMany();
  // const updatedNotes: any = [];
  // // if has scheduleTo, update it to remove seconds
  // for (const note of allUserNotes) {
  //   if (note.scheduledTo) {
  //     note.scheduledTo = new Date(note.scheduledTo);
  //     note.scheduledTo.setSeconds(0);
  //     note.scheduledTo.setMilliseconds(0);
  //     updatedNotes.push(note);
  //   }
  // }
  // let i = 0;
  // for (const note of updatedNotes) {
  //   console.log(`Updating note ${i} of ${updatedNotes.length}`);
  //   await prisma.note.update({
  //     where: { id: note.id },
  //     data: { scheduledTo: note.scheduledTo },
  //   });
  //   i++;
  // }

  // Get all users with publications
  // const usersWithPublications = await prisma.userMetadata.findMany({
  //   where: {
  //     publication: {
  //       isNot: null,
  //     },
  //   },
  //   select: {
  //     userId: true,
  //   },
  // });

  // const userIds = usersWithPublications.map(user => user.userId);
  // const batchSize = 5;
  // const batches = [];

  // // Split users into batches of 5
  // for (let i = 0; i < userIds.length; i += batchSize) {
  //   batches.push(userIds.slice(i, i + batchSize));
  // }

  // // Process each batch
  // for (const batch of batches) {
  //   console.log(`Processing batch of ${batch.length} users...`);
  //   await processBatch(batch);
  //   // Add a small delay between batches to avoid rate limiting
  //   await new Promise(resolve => setTimeout(resolve, 1000));
  // }

  // const result = await testEndpoint();
  // const mailResult = await sendMail({
  //   to: "orelsmail@gmail.com",
  //   from: "orel",
  //   subject: "Test",
  //   template: welcomeTemplate(),
  //   cc: ["orelzilberman@gmail.com"],
  // });

  // const subscription = await getActiveSubscription(session.user.id);

  // if (!subscription) {
  //   return NextResponse.json(
  //     { error: "No active subscription found" },
  //     { status: 400 },
  //   );
  // }

  // const mailResult = await sendMail({
  //   to: "orelsmail@gmail.com",
  //   from: "Orel from WriteStack",
  //   subject: "Your Trial is Ending Soon",
  //   template: generateFailedToSendNoteEmail(
  //     "67f772a23b037dc651e2e072",
  //     "67f772a23b037dc651e2e072",
  //   ),
  //   cc: ["orelzilberman@gmail.com"],
  // });
  // const date = new Date("2025-03-27T01:37:20.962+00:00");
  // const users = await prisma.user.findMany({
  //   where: {
  //     createdAt: {
  //       gte: date,
  //     },
  //   },
  //   select: {
  //     email: true,
  //     name: true,
  //     createdAt: true,
  //   },
  // });

  // const usersToAdd = users.map(user => ({
  //   email: user.email || "",
  //   fullName: user.name || "",
  // }));

  // usersToAdd.pop();

  // for (const user of usersToAdd) {
  //   const mailResult = await addUserToList(user);
  //   console.log(mailResult);
  // }

  // const mailResult2 = await addUserToList({
  //   email: "ayodejiawosika@gmail.com",
  //   fullName: "Ayodeji Awosika",
  // });

  return NextResponse.json({ success: true });
  // } catch (error) {
  //   console.error("Error processing users:", error);
  //   return NextResponse.json(
  //     { error: "Failed to process users" },
  //     { status: 500 },
  //   );
  // }
}
