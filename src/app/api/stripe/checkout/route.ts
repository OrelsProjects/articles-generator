import { authOptions } from "@/auth/authOptions";
import { getStripeInstance } from "@/lib/stripe";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { generateSessionId } from "@/lib/stripe";
import { z } from "zod";
import prisma from "@/app/api/_db/db";

const checkoutSchema = z.object({
  plan: z.enum(["hobbyist", "standard", "premium"]),
  interval: z.enum(["month", "year"]),
  referralCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const nextUrl = req.nextUrl;
    const { plan, interval, referralCode } = checkoutSchema.parse(
      await req.json(),
    );

    const userPastSubscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    const userHasSubscription = !!userPastSubscription;

    const productId =
      plan === "hobbyist"
        ? process.env.STRIPE_PRICING_ID_HOBBYIST
        : plan === "standard"
          ? process.env.STRIPE_PRICING_ID_STANDARD
          : process.env.STRIPE_PRICING_ID_PREMIUM;

    console.log("productId", productId);

    if (!productId) {
      loggerServer.error("Invalid pricing plan", { plan });
      return NextResponse.json(
        { error: "Invalid pricing plan" },
        { status: 400 },
      );
    }

    const stripe = getStripeInstance();

    const product = await stripe.products.retrieve(productId);
    if (!product) {
      loggerServer.error("Product not found", { productId });
      return NextResponse.json({ error: "Product not found" }, { status: 400 });
    }

    console.log("product", product);

    const prices = await stripe.prices.list({
      product: productId,
    });

    const price = prices.data.find(
      price => price.recurring?.interval === interval,
    );

    console.log("price", price);

    if (!price) {
      loggerServer.error("Price not found", { productId, interval });
      return NextResponse.json({ error: "Price not found" }, { status: 400 });
    }

    const sessionId = await generateSessionId({
      priceId: price.id,
      productId: productId,
      urlOrigin: nextUrl.origin,
      userId: session.user.id,
      email: session.user.email || null,
      name: session.user.name || null,
      freeTrial: userHasSubscription ? 0 : 7,
      referralCode,
      allowCoupon: true,
    });

    console.log("sessionId", sessionId);

    return NextResponse.json({ sessionId }, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Error creating a checkout session", error);
    return NextResponse.json(
      { error: "Error creating a checkout session" },
      { status: 500 },
    );
  }
}
