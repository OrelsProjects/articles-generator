import prisma from "@/app/api/_db/db";
import { setFeatureFlagsByPlan } from "@/lib/dal/userMetadata";
import { addUserToList, sendMail } from "@/lib/mail/mail";
import {
  generateSubscriptionDeletedEmail,
  generateSubscriptionTrialEndingEmail,
} from "@/lib/mail/templates";
import { creditsPerPlan } from "@/lib/plans-consts";
import { getStripeInstance } from "@/lib/stripe";
import loggerServer from "@/loggerServer";
import { Logger } from "@datadog/browser-logs";
import { Plan } from "@prisma/client";
import { Stripe } from "stripe";

async function getUserBySubscription(subscription: Stripe.Subscription) {
  const customer = await getStripeInstance().customers.retrieve(
    subscription.customer as string,
  );
  const email = (customer as Stripe.Customer).email;
  if (!email) {
    loggerServer.error("No email found for customer", {
      subscription: `${JSON.stringify(subscription)}`,
    });
    return null;
  }
  return await prisma.user.findUnique({
    where: { email: email },
  });
}

export async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const existingSubscription = await prisma.subscription.findUnique({
    where: {
      stripeSubId: subscription.id,
    },
  });

  if (existingSubscription) {
    loggerServer.info("Subscription already exists", {
      subscriptionId: subscription.id,
    });
    return;
  }

  const product = await getStripeInstance().products.retrieve(
    subscription.items.data[0].plan.product as string,
  );
  if (!product) {
    loggerServer.error("No product found for subscription", {
      subscription: `${JSON.stringify(subscription)}`,
    });
    throw new Error("No product found for subscription");
  }
  const subscriptionId = subscription.id;
  const user = await getUserBySubscription(subscription);
  const isTrialing = subscription.trial_end !== null;
  const isFreeSubscription = subscription.metadata?.isFreeSubscription;
  const plan: Plan = product.metadata?.plan as Plan;
  if (!user) {
    loggerServer.error("No user found for subscription", {
      subscription: `${JSON.stringify(subscription)}`,
    });
    return;
  }

  await prisma.subscription.create({
    data: {
      status: "active",
      userId: user?.id,
      plan: plan,
      stripeSubId: subscriptionId,
      startDate: new Date(),
      endDate: null,
      isTrialing: isTrialing,
      trialStart: isTrialing ? new Date() : null,
      trialEnd: isTrialing ? new Date(subscription.trial_end! * 1000) : null,

      // Credits information
      creditsPerPeriod: creditsPerPlan[plan],
      creditsRemaining: isFreeSubscription ? 12 : creditsPerPlan[plan],
      lastCreditReset: new Date(),

      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  await setFeatureFlagsByPlan(plan, user.id);

  if (user.email && user.name) {
    await addUserToList({
      email: user.email!,
      fullName: user.name!,
    });
  } else {
    loggerServer.error("No email or name found for user" + user.id, {
      userId: user.id,
    });
  }
}

// Cases when Update is called:
// - Subscription is updated (e.g. trial ends)
// - Subscription is paused
// - Subscription is resumed
// - Subscription is deleted
export async function handleSubscriptionUpdated(event: any) {
  const subscription = event.data.object as Stripe.Subscription;
  const subscriptionId = subscription.id;
  const user = await getUserBySubscription(subscription);
  if (!user) {
    loggerServer.error("No user found for subscription", {
      subscription: `${JSON.stringify(subscription)}`,
    });
    return;
  }

  // await prisma.subscription.update({
  //   where: {
  //     id: subscriptionId,
  //   },
  //   data: {
  //     endDate: new Date(subscription.current_period_end * 1000),
  //   },
  // });
}

export async function handleSubscriptionPaused(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const subscriptionId = subscription.id;
  const user = await getUserBySubscription(subscription);
  if (!user) {
    loggerServer.error("No user found for subscription", {
      subscription: `${JSON.stringify(subscription)}`,
    });
    return;
  }
  await prisma.subscription.update({
    where: {
      id: subscriptionId,
    },
    data: {
      status: "paused",
    },
  });
}

export async function handleSubscriptionResumed(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const subscriptionId = subscription.id;
  const user = await getUserBySubscription(subscription);
  if (!user) {
    loggerServer.error("No user found for subscription", {
      subscription: `${JSON.stringify(subscription)}`,
    });
    return;
  }
  await prisma.subscription.update({
    where: {
      id: subscriptionId,
    },
    data: {
      status: "active",
    },
  });
}

export async function handleSubscriptionDeleted(event: Stripe.Event) {
  const stripe = getStripeInstance();
  const subscription = event.data.object as Stripe.Subscription;
  const subscriptionId = subscription.id;
  const customer = await stripe.customers.retrieve(
    subscription.customer as string,
  );
  await prisma.subscription.update({
    where: {
      id: subscriptionId,
    },
    data: {
      status: "inactive",
    },
  });

  const userEmail = (customer as any).email;
  await sendMail({
    to: userEmail,
    from: "orel",
    subject: "Subscription Deleted",
    template: generateSubscriptionDeletedEmail(subscriptionId),
    cc: [],
  });
}

export async function handleSubscriptionTrialEnding(event: any) {
  const stripe = getStripeInstance();
  const subscription = event.data.object as any;
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userEmail = (customer as any).email;

  // Send email notification about trial ending
  await sendMail({
    to: userEmail,
    from: "orel",
    subject: "Your Trial is Ending Soon",
    template: generateSubscriptionTrialEndingEmail(
      subscription.id,
      new Date(subscription.trial_end * 1000),
    ),
    cc: ["orelsmail@gmail.com"],
  });
}
