import { authOptions } from "@/auth/authOptions";
import { getActiveSubscription } from "@/lib/dal/subscription";
import { getPlanPriceId, getStripeInstance } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Plan } from "@prisma/client";

// If the user is on a free trial, automatically move them to the new plan
// If not, create a checkout session to upgrade
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan, interval } = await req.json();
  if (!plan || !interval) {
    return NextResponse.json(
      { error: "Missing plan or interval" },
      { status: 400 },
    );
  }

  const stripe = getStripeInstance();
  const userId = session.user.id;

  const planLower = plan.toLowerCase() as Plan;
  const planId =
    planLower === "hobbyist"
      ? process.env.STRIPE_PRICING_ID_HOBBYIST
      : planLower === "standard"
        ? process.env.STRIPE_PRICING_ID_STANDARD
        : process.env.STRIPE_PRICING_ID_PREMIUM;

  try {
    // Get current subscription
    const currentSubscription = await getActiveSubscription(userId);

    if (!currentSubscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 },
      );
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      currentSubscription.stripeSubId,
    );
    // Create the items array with the new price
    const price = await getPlanPriceId(stripe, interval, plan as Plan, planId);

    if (!price) {
      return NextResponse.json(
        { error: "Price not found for plan and interval" },
        { status: 404 },
      );
    }

    await stripe.subscriptions.update(currentSubscription.stripeSubId, {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: price,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      data: {
        plan,
      },
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 },
    );
  }
}
