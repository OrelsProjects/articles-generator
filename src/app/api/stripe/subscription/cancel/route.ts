import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/api/_db/db";
import loggerServer from "@/loggerServer";
import { getStripeInstance } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1. Find user's active subscription
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: "active" },
    });
    if (!subscription) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    const stripe = getStripeInstance();
    
    // 2. Get current subscription from Stripe to get the period end
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubId);
    
    // 3. Cancel subscription in Stripe but keep it active until period end
    await stripe.subscriptions.update(subscription.stripeSubId, {
      cancel_at_period_end: true,
    });

    // 4. Update local DB record - keep status active but mark as canceling at period end
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        // Keep the status as "active" until the period ends
        status: "active",
        // Store the future end date
        endDate: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    return NextResponse.json({ 
      success: true,
      endsAt: new Date(stripeSubscription.current_period_end * 1000)
    }, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Cancel subscription failed", error);
    return NextResponse.json({ error: error.message || "Error" }, { status: 500 });
  }
} 