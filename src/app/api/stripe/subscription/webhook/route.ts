import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripeInstance } from "@/lib/stripe";
import loggerServer from "@/loggerServer";
import {
  handleCheckoutSessionCompleted,
  handleInvoicePaymentFailed,
  handleInvoicePaymentSucceeded,
  handleSubscriptionCreated,
  handleSubscriptionDeleted,
  handleSubscriptionPaused,
  handleSubscriptionResumed,
  handleSubscriptionTrialEnding,
  handleSubscriptionUpdated,
} from "@/lib/utils/webhook";
import Stripe from "stripe";

const relevantEvents = new Set([
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.created",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "customer.subscription.trial_will_end",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
  "checkout.session.completed",
]);

export async function POST(req: NextRequest) {
  console.log("Stripe webhook received");
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
  console.log("Stripe webhook event:", event);
  if (!relevantEvents.has(event.type)) {
    loggerServer.info("Ignoring irrelevant event type:", { type: event.type });
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event);
        break;
      case "customer.subscription.trial_will_end":
        await handleSubscriptionTrialEnding(event);
        break;
      case "customer.subscription.paused":
        await handleSubscriptionPaused(event);
        break;
      case "customer.subscription.resumed":
        await handleSubscriptionResumed(event);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event);
        break;
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event);
        break;
      default:
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Webhook processing failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
