import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/api/_db/db";
import { creditsPerPlan } from "@/lib/plans-consts";

// This endpoint should be called by a cron job monthly to reset credits
export async function POST(req: NextRequest) {
  // Verify the request is authorized (implement your own auth mechanism)
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all active subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: "active",
      },
      include: {
        user: {
          include: {
            userMetadata: true,
          },
        },
      },
    });

    const results = [];

    // Process each subscription
    for (const subscription of subscriptions) {
      try {
        // Get the plan and calculate credits
        const planName = subscription.plan;
        const planKey = planName.toLowerCase() as keyof typeof creditsPerPlan;
        const creditsForPlan = creditsPerPlan[planKey] || creditsPerPlan.free;

        // Update the subscription
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            creditsRemaining: creditsForPlan,
            creditsPerPeriod: creditsForPlan,
            lastCreditReset: new Date(),
          },
        });

        // Update the user's metadata
        if (subscription.user?.userMetadata?.[0]) {
          await prisma.userMetadata.update({
            where: { id: subscription.user.userMetadata[0].id },
            data: { credits: creditsForPlan },
          });
        }

        results.push({
          subscriptionId: subscription.id,
          userId: subscription.userId,
          plan: planName,
          credits: creditsForPlan,
          status: "success",
        });
      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        results.push({
          subscriptionId: subscription.id,
          userId: subscription.userId,
          status: "error",
          error: (error as Error).message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: subscriptions.length,
      results,
    });
  } catch (error) {
    console.error("Error resetting credits:", error);
    return NextResponse.json(
      { error: "Failed to reset credits" },
      { status: 500 }
    );
  }
} 