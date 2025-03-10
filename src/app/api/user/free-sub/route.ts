import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { Plan } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getStripeInstance } from "@/lib/stripe";

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
      return NextResponse.json(
        { error: "Code doesn't exist" },
        { status: 400 },
      );
    }

    const now = new Date();
    const canUseCode =
      freeUser.codeExpiresAt &&
      freeUser.codeExpiresAt > now &&
      freeUser.status === "new";

    if (!canUseCode) {
      return NextResponse.json(
        { error: "The code has expired" },
        { status: 400 },
      );
    }

    // Get the Stripe instance
    const stripe = getStripeInstance();

    // Get the premium product ID
    const productId = process.env.STRIPE_PRICING_ID_PREMIUM;
    if (!productId) {
      loggerServer.error("Premium product ID not found");
      return NextResponse.json({ error: "Product not found" }, { status: 400 });
    }

    // Get the prices for the premium product
    const prices = await stripe.prices.list({
      product: productId,
    });

    // Find the monthly price
    const price = prices.data.find(
      price => price.recurring?.interval === "month",
    );

    if (!price) {
      loggerServer.error("Price not found", { productId, interval: "month" });
      return NextResponse.json({ error: "Price not found" }, { status: 400 });
    }

    // Mark the free user code as used
    await prisma.freeUsers.update({
      where: { id: freeUser.id },
      data: { status: "used" },
    });

    // Calculate the end date (30 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);

    // Create a customer first
    const customer = await stripe.customers.create({
      email: session.user.email || undefined,
      metadata: {
        userId: session.user.id,
        freeTrialCode: code,
      },
    });

    // Create a subscription with trial_end and cancel_at set to the same date
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      trial_period_days: 30,
      cancel_at_period_end: true,
      metadata: {
        freeTrialCode: code,
        isFreeSubscription: "true",
        userId: session.user.id,
        productId,
      },
    });

    // Create a checkout session just for the success redirect
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "setup",
      customer: customer.id,
      success_url: `${request.headers.get("origin") || process.env.NEXTAUTH_URL}/api/stripe/subscription/success?session_id={CHECKOUT_SESSION_ID}&subscription_id=${subscription.id}`,
      cancel_url: `${request.headers.get("origin") || process.env.NEXTAUTH_URL}/cancel`,
      client_reference_id: session.user.id,
      metadata: {
        freeTrialCode: code,
        isFreeSubscription: "true",
        productId,
        priceId: price.id,
        subscriptionId: subscription.id,
      },
    });

    loggerServer.info("Free premium subscription created", {
      userId: session.user.id,
      customerId: customer.id,
      subscriptionId: subscription.id,
      sessionId: checkoutSession.id,
      plan: "premium",
      duration: "1 month",
      trialEndDate: trialEndDate.toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        subscriptionId: subscription.id,
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      },
      { status: 200 },
    );
  } catch (error: any) {
    loggerServer.error("Error in free-sub route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
