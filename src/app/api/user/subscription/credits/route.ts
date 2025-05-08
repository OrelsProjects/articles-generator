import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";
import { pricePerTokens } from "@/lib/plans-consts";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getStripeInstance } from "@/lib/stripe";
import { getActiveSubscription } from "@/lib/dal/subscription";

const bodySchema = z.object({
  credits: z.number(),
});

const env = process.env.NODE_ENV;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { credits } = bodySchema.parse(body);

    const price = pricePerTokens.find(price => price.value === credits)?.price;

    if (!price) {
      return new Response("Invalid credits", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    });

    const subscription = await getActiveSubscription(session.user.id);

    if (!subscription) {
      return new Response("No subscription found", { status: 400 });
    }

    const stripe = getStripeInstance();

    const paymentSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${credits} credits pack`,
              description: `Purchase of ${credits} credits for WriteStack`,
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        userId: session.user.id,
        credits,
      },
      success_url:
        env === "development"
          ? "http://localhost:3000/home"
          : "https://www.writestack.io/home",
      cancel_url:
        env === "development"
          ? "http://localhost:3000/home"
          : "https://www.writestack.io/home",
    });

    return NextResponse.json({ sessionId: paymentSession.id }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
