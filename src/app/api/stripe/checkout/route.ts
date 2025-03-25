import { authOptions } from "@/auth/authOptions";
import { getStripeInstance } from "@/lib/stripe";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { generateSessionId } from "@/lib/stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  plan: z.enum(["standard", "premium", "executive", "hobbyist"]),
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

    const productId =
      plan === "standard" || plan === "hobbyist"
        ? process.env.STRIPE_PRICING_ID_STANDARD
        : plan === "premium"
          ? process.env.STRIPE_PRICING_ID_PREMIUM
          : process.env.STRIPE_PRICING_ID_EXECUTIVE;

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

    const prices = await stripe.prices.list({
      product: productId,
    });

    const price = prices.data.find(
      price => price.recurring?.interval === interval,
    );
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
      freeTrial: 7,
      referralCode,
    });
    return NextResponse.json({ sessionId }, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Error creating a checkout session", error);
    return NextResponse.json(
      { error: "Error creating a checkout session" },
      { status: 500 },
    );
  }
}
