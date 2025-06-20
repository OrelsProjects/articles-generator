import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import loggerServer from "@/loggerServer";
import { getStripeInstance } from "@/lib/stripe";
import { getActiveSubscription } from "@/lib/dal/subscription";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    if (!session.user.id) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1. Find user's active subscription
    const subscription = await getActiveSubscription(session.user.id);
    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 },
      );
    }

    // 2. Check if subscription is actually scheduled for cancellation
    if (!subscription.cancelAtPeriodEnd) {
      return NextResponse.json(
        { error: "Subscription is not scheduled for cancellation" },
        { status: 400 },
      );
    }

    const stripe = getStripeInstance();

    // 3. Uncancel subscription in Stripe
    await stripe.subscriptions.update(subscription.stripeSubId, {
      cancel_at_period_end: false,
    });

    // 4. Update local DB record - remove the cancellation
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Subscription reactivated successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    loggerServer.error("Uncancel subscription failed", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: error.message || "Error" },
      { status: 500 },
    );
  }
} 