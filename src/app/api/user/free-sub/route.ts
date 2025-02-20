import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { Plan } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getPlanPriceId, getStripeInstance } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const freeUser = await prisma.freeUsers.findFirst({
      where: { code },
    });

    if (!freeUser) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const now = new Date();
    const canUseCode =
      freeUser.codeExpiresAt &&
      freeUser.codeExpiresAt > now &&
      freeUser.status === "new";

    if (!canUseCode) {
      return NextResponse.json({ error: "Code is expired" }, { status: 400 });
    }

    const stripe = getStripeInstance();

    let potentialCustomers = await stripe.customers.list({
      email: session.user.email as string,
    });

    let customer = potentialCustomers.data[0];

    if (potentialCustomers.data.length === 0) {
      customer = await stripe.customers.create({
        email: session.user.email as string,
      });
    }
    // Calculate subscription end date (e.g., 1 year from now)
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const priceId = await getPlanPriceId(stripe, "year");

    // Create a free subscription in Stripe
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }], // Your free tier price ID
      trial_end: Math.floor(endDate.getTime() / 1000), // Convert to Unix timestamp
      metadata: {
        isFreeTier: "true",
        promoCode: code,
      },
    });

    // Create subscription record in your database
    await prisma.subscription.create({
      data: {
        stripeSubId: stripeSubscription.id,
        plan: freeUser.plan,
        status: "active",
        currentPeriodStart: new Date(
          stripeSubscription.current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(
          stripeSubscription.current_period_end * 1000,
        ),
        cancelAtPeriodEnd: true, // Will not auto-renew
        user: {
          connect: {
            id: session.user.id,
          },
        },
      },
    });

    // Mark code as used
    await prisma.freeUsers.update({
      where: {
        id: freeUser.id,
      },
      data: {
        email: session.user.email as string,
        status: "used",
      },
    });

    return NextResponse.json({
      plan: freeUser.plan,
      stripeSubscriptionId: stripeSubscription.id,
    });
  } catch (error: any) {
    loggerServer.error("Error in free-sub route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
