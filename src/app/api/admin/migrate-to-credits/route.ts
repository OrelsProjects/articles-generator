import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import prisma from "@/app/api/_db/db";
import { creditsPerPlan } from "@/lib/plans-consts";

// This is an admin-only endpoint to migrate existing users to the credits system
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is admin (you should implement proper admin checks)
  if (!session?.user?.email || !session.user.email.endsWith("@yourdomain.com")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all users with their subscriptions
    const users = await prisma.user.findMany({
      include: {
        Subscription: true,
        userMetadata: true,
      },
    });

    const results = [];

    // Process each user
    for (const user of users) {
      try {
        // Get the user's plan
        const subscription = user.Subscription?.[0];
        const planName = subscription?.plan || "free";
        const planKey = planName.toLowerCase() as keyof typeof creditsPerPlan;
        const creditsForPlan = creditsPerPlan[planKey] || creditsPerPlan.free;

        // Update user metadata with credits
        if (user.userMetadata?.[0]) {
          await prisma.userMetadata.update({
            where: { id: user.userMetadata[0].id },
            data: { credits: creditsForPlan },
          });
        } else {
          // Create user metadata if it doesn't exist
          await prisma.userMetadata.create({
            data: {
              userId: user.id,
              credits: creditsForPlan,
            },
          });
        }

        // Update subscription with credit information if it exists
        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              creditsRemaining: creditsForPlan,
              creditsPerPeriod: creditsForPlan,
              lastCreditReset: new Date(),
            },
          });
        }

        results.push({
          userId: user.id,
          email: user.email,
          plan: planName,
          credits: creditsForPlan,
          status: "success",
        });
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        results.push({
          userId: user.id,
          email: user.email,
          status: "error",
          error: (error as Error).message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: users.length,
      results,
    });
  } catch (error) {
    console.error("Error migrating users to credits system:", error);
    return NextResponse.json(
      { error: "Failed to migrate users to credits system" },
      { status: 500 }
    );
  }
} 