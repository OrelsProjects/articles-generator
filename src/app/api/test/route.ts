import prisma from "@/app/api/_db/db";
import { getPlanPriceId, getStripeInstance } from "@/lib/stripe";

async function createSubscription(userId: string) {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Create subscription record in your database
  await prisma.subscription.create({
    data: {
      stripeSubId: "free_" + userId,
      plan: "superPro",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: thirtyDaysFromNow,
      cancelAtPeriodEnd: true, // Will not auto-renew
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}

export async function GET() {
  // This function goes over all the usersMetadata.
  // In the last version they had plan in the userMetadata.plan.
  // If they have superPro, use the functio above then delete userMetadata.plan
//   const usersMetadata = await prisma.userMetadata.findMany({
//     include: {
//       user: true,
//     },
//   });
//   for (const userMetadata of usersMetadata) {
//     if (!userMetadata.user.email) continue;
//     if (userMetadata.plan === "superPro") {
//       await createSubscription(userMetadata.userId);
//     }
//   }
}
