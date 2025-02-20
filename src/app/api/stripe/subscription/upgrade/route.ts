import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/api/_db/db";
import loggerServer from "@/loggerServer";
import { getPlanPriceId, getStripeInstance } from "@/lib/stripe";
import { Plan } from "@prisma/client";

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
      return NextResponse.json({ error: "No active subscription" }, { status: 404 });
    }

    const yearlyPriceId = await getPlanPriceId(getStripeInstance(), "year");

    const stripe = getStripeInstance();
    const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubId);

    const updated = await stripe.subscriptions.update(subscription.stripeSubId, {
      items: [
        {
          id: stripeSub.items.data[0].id,
          price: yearlyPriceId,
        },
      ],
      proration_behavior: "create_prorations",
    });

    // 4. Update local subscription record
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: Plan.superPro, // your annual plan in enum
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, subscription: updated }, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Upgrade subscription error", error);
    return NextResponse.json({ error: error.message || "Error" }, { status: 500 });
  }
} 