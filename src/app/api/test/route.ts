import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import prisma from "@/app/api/_db/db";
import { NextResponse } from "next/server";
import { runPrompt } from "@/lib/open-router";
import { generateVectorSearchOptimizedDescriptionPrompt } from "@/lib/prompts";
import { parseJson } from "@/lib/utils/json";
import { addUserToList, sendMail, testEndpoint } from "@/lib/mail/mail";
import {
  generateSubscriptionTrialEndingEmail,
  welcomeTemplate,
} from "@/lib/mail/templates";

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

  try {
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


    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "active",
      }, 
    });

    if (!subscription) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
    }
    
    
    
    

    const mailResult = await sendMail({
      to: "orelsmail@gmail.com",
      from: "Orel from WriteRoom 👋",
      subject: "Your Trial is Ending Soon",
      template: generateSubscriptionTrialEndingEmail(
        subscription.plan,
        new Date(),
      ),
      cc: ["orelzilberman@gmail.com"],
    });
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
  } catch (error) {
    console.error("Error processing users:", error);
    return NextResponse.json(
      { error: "Failed to process users" },
      { status: 500 },
    );
  }
}
