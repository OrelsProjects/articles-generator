import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripeInstance } from "@/lib/stripe";
import prisma from "@/app/api/_db/db";
import loggerServer from "@/loggerServer";

const relevantEvents = new Set([
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.created",
]);

export async function POST(req: NextRequest) {
  const stripe = getStripeInstance();
  const sig = headers().get("stripe-signature") || "";
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || "",
    );
  } catch (err: any) {
    loggerServer.error("⚠️ Webhook signature verification failed.", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!relevantEvents.has(event.type)) {
    loggerServer.info("Ignoring irrelevant event type:", { type: event.type });
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as any;

      const localSub = await prisma.subscription.findUnique({
        where: { stripeSubId: subscription.id },
      });

      if (!localSub) {
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Handle cancellation while keeping subscription active until period end
      if (subscription.cancel_at_period_end) {
        await prisma.subscription.update({
          where: { id: localSub.id },
          data: {
            cancelAtPeriodEnd: true,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            currentPeriodStart: new Date(
              subscription.current_period_start * 1000,
            ),
            status: "active", // Keep status active until period ends
          },
        });
      } else if (subscription.status === "active") {
        // Handle plan changes or renewal
        const plan =
          subscription.items.data[0].price.recurring.interval === "year"
            ? "superPro"
            : "pro";

        await prisma.subscription.update({
          where: { id: localSub.id },
          data: {
            status: "active",
            plan,
            cancelAtPeriodEnd: false,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            currentPeriodStart: new Date(
              subscription.current_period_start * 1000,
            ),
          },
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as any;
      await prisma.subscription.updateMany({
        where: { stripeSubId: subscription.id },
        data: {
          status: "canceled",
          endDate: new Date(),
          cancelAtPeriodEnd: false,
        },
      });
    }

    if (event.type === "customer.subscription.created") {
      const subscription = event.data.object as any;
      const localSub = await prisma.subscription.findUnique({
        where: { stripeSubId: subscription.id },
      });

      if (!localSub) {
        const plan =
          subscription.items.data[0].price.recurring.interval === "year"
            ? "superPro"
            : "pro";

        const customerId = subscription.customer;
        const customer = await stripe.customers.retrieve(customerId);
        const userEmail = (customer as any).email;

        await prisma.subscription.create({
          data: {
            stripeSubId: subscription.id,
            status: "active",
            plan,
            currentPeriodStart: new Date(
              subscription.current_period_start * 1000,
            ),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: false,
            user: {
              connect: {
                email: userEmail,
              },
            },
          },
        });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Webhook processing failed", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
