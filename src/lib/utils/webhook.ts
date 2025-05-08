import { prisma } from "@/lib/prisma";
import {
  getActiveSubscription,
  getActiveSubscriptionByStripeSubId,
} from "@/lib/dal/subscription";
import { setFeatureFlagsByPlan } from "@/lib/dal/userMetadata";
import { sendMail } from "@/lib/mail/mail";
import {
  generateFreeSubscriptionEndedEmail,
  generateFreeTrialEndingEmail,
  generateInvoicePaymentFailedEmail,
  generatePaymentConfirmationEmail,
  generateSubscriptionDeletedEmail,
  generateSubscriptionTrialEndingEmail,
  generateWelcomeTemplateTrial,
} from "@/lib/mail/templates";
import { creditsPerPlan } from "@/lib/plans-consts";
import { getStripeInstance } from "@/lib/stripe";
import { calculateNewPlanCreditsLeft } from "@/lib/utils/credits";
import loggerServer from "@/loggerServer";
import { Interval, Payment, Plan, Subscription } from "@prisma/client";
import { Stripe } from "stripe";

async function getUserBySubscription(subscription: Stripe.Subscription) {
  const customer = await getStripeInstance().customers.retrieve(
    subscription.customer as string,
  );
  const email = (customer as Stripe.Customer).email;
  if (!email) {
    loggerServer.error("[getUserBySubscription] No email found for customer", {
      subscription: `${JSON.stringify(subscription)}`,
      userId: "unknown",
    });
    return null;
  }
  return await prisma.user.findUnique({
    where: { email: email },
  });
}

async function getPlanBySubscription(subscription: Stripe.Subscription) {
  const product = await getStripeInstance().products.retrieve(
    subscription.items.data[0].plan.product as string,
  );
  return await getPlanByProductId(product.id);
}

export const getPlanByProductId = async (
  productId: string,
): Promise<Plan | null> => {
  if (productId === process.env.STRIPE_PRICING_ID_PREMIUM) {
    return "premium";
  }
  if (productId === process.env.STRIPE_PRICING_ID_STANDARD) {
    return "standard";
  }
  return "hobbyist";
};

export async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const price = await getStripeInstance().prices.retrieve(
    subscription.items.data[0].plan.id as string,
  );
  const product = await getStripeInstance().products.retrieve(
    subscription.items.data[0].plan.product as string,
  );
  if (!product) {
    loggerServer.error(
      "[SUBSCRIPTION-CREATED] No product found for subscription",
      {
        subscription: `${JSON.stringify(subscription)}`,
        userId: "unknown",
      },
    );
    throw new Error("No product found for subscription");
  }
  const subscriptionId = subscription.id;
  const user = await getUserBySubscription(subscription);
  const isTrialing = subscription.status === "trialing";
  const isFreeSubscription = subscription.metadata?.isFreeSubscription;
  const plan: Plan = product.metadata?.plan as Plan;
  if (!user) {
    loggerServer.error(
      "[SUBSCRIPTION-CREATED] No user found for subscription",
      {
        subscription: `${JSON.stringify(subscription)}`,
        userId: "unknown",
      },
    );
    return;
  }

  const userPriorSubscriptions = await prisma.subscription.findMany({
    where: {
      userId: user.id,
    },
  });

  // Gather all his prior credits
  const priorCredits = userPriorSubscriptions.reduce((acc, curr) => {
    return acc + curr.creditsRemaining;
  }, 0);

  const newCredits = isFreeSubscription
    ? 10
    : isTrialing // If the subscription is trialing, we add credits here. If not, we add them after the first payment.
      ? creditsPerPlan[plan]
      : 0;

  const subscriptionData = {
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
    creditsRemaining: newCredits + priorCredits,
    lastCreditReset: new Date(),

    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,

    interval: (price.recurring?.interval || "month") as Interval,
    couponIdApplied: subscription.discount?.coupon?.id || null,
  };

  await prisma.subscription.upsert({
    where: {
      stripeSubId: subscriptionId,
    },
    create: subscriptionData,
    update: subscriptionData,
  });

  await setFeatureFlagsByPlan(plan, user.id);

  // if (user.email && user.name) {
  //   try {
  //     await addUserToList({
  //       email: user.email!,
  //       fullName: user.name!,
  //     });
  //   } catch (error) {
  //     loggerServer.error("Error adding user to list", { error });
  //   }
  // } else {
  //   loggerServer.error("No email or name found for user" + user.id, {
  //     userId: user.id,
  //   });
  // }
}

// Cases when Update is called:
// - Subscription is updated (e.g. trial ends)
// - Subscription is paused
// - Subscription is resumed
// - Subscription is deleted
export async function handleSubscriptionUpdated(event: any) {
  const subscription = event.data.object as Stripe.Subscription;
  const subscriptionId = subscription.id;
  const price = await getStripeInstance().prices.retrieve(
    subscription.items.data[0].plan.id as string,
  );
  const plan = await getPlanBySubscription(subscription);
  const user = await getUserBySubscription(subscription);
  if (!user) {
    loggerServer.error(
      "[SUBSCRIPTION-UPDATED] No user found for subscription",
      {
        subscription: `${JSON.stringify(subscription)}`,
        userId: "unknown",
      },
    );
    throw new Error("No user found for subscription");
  }

  if (!plan) {
    loggerServer.error(
      "[SUBSCRIPTION-UPDATED] No plan found for subscription",
      {
        subscription: `${JSON.stringify(subscription)}`,
        userId: user.id,
      },
    );
    throw new Error("No plan found for subscription");
  }

  const currentSubscription = await getActiveSubscription(user.id);

  if (!currentSubscription) {
    loggerServer.error("No subscription found for user", {
      userId: user.id,
    });
    throw new Error("No subscription found for user");
  }

  const { creditsLeft, creditsForPlan } = await calculateNewPlanCreditsLeft(
    user.id,
    plan,
    currentSubscription,
  );
  const { id, ...currentSubscriptionNoId } = currentSubscription;

  const newSubscription: Omit<Subscription, "id"> = {
    ...currentSubscriptionNoId,
    plan: plan || currentSubscription.plan,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    creditsPerPeriod: creditsForPlan,
    creditsRemaining: creditsLeft,
    startDate: currentSubscription.startDate,
    endDate: currentSubscription.endDate,
    isTrialing: subscription.status === "trialing",
    trialStart: subscription.trial_start
      ? new Date(subscription.trial_start * 1000)
      : currentSubscription.trialStart,
    trialEnd: subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : currentSubscription.trialEnd,
    interval: (price.recurring?.interval || "month") as Interval,
    couponIdApplied: subscription.discount?.coupon?.id || null,
  };

  await prisma.subscription.update({
    where: {
      stripeSubId: subscriptionId,
    },
    data: newSubscription,
  });

  // if (user.email) {
  //   const emailTemplate = generateWelcomeTemplateTrial(user.name || undefined);
  //   await sendMail({
  //     to: user.email!,
  //     from: "support",
  //     subject: emailTemplate.subject,
  //     template: emailTemplate.body,
  //     cc: [],
  //   });
  // }
}

export async function handleSubscriptionPaused(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const subscriptionId = subscription.id;
  const user = await getUserBySubscription(subscription);
  const plan = await getPlanBySubscription(subscription);
  if (!user) {
    loggerServer.error("[SUBSCRIPTION-PAUSED] No user found for subscription", {
      subscription: `${JSON.stringify(subscription)}`,
      userId: "unknown",
    });
    return;
  }
  await prisma.subscription.update({
    where: {
      stripeSubId: subscriptionId,
    },
    data: {
      status: "paused",
    },
  });

  if (subscription.metadata?.freeTrialCode) {
    const emailTemplate = generateFreeSubscriptionEndedEmail(
      user.name || undefined,
    );
    await sendMail({
      to: user.email!,
      from: "support",
      subject: emailTemplate.subject,
      template: emailTemplate.body,
      cc: [],
    });
  } else {
    const emailTemplate = generateSubscriptionDeletedEmail(
      user.name || undefined,
      plan?.toString(),
    );
    await sendMail({
      to: user.email!,
      from: "support",
      subject: emailTemplate.subject,
      template: emailTemplate.body,
      cc: [],
    });
  }
}

export async function handleSubscriptionResumed(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const subscriptionId = subscription.id;
  const user = await getUserBySubscription(subscription);
  if (!user) {
    loggerServer.error(
      "[SUBSCRIPTION-RESUMED] No user found for subscription",
      {
        subscription: `${JSON.stringify(subscription)}`,
        userId: "unknown",
      },
    );
    return;
  }
  await prisma.subscription.update({
    where: {
      stripeSubId: subscriptionId,
    },
    data: {
      status: "active",
    },
  });
}

// this function is called with a subscription from stripe is cancelled
export async function handleSubscriptionDeleted(event: Stripe.Event) {
  const stripe = getStripeInstance();
  const subscription = event.data.object as Stripe.Subscription;
  const subscriptionId = subscription.id;
  const customer = await stripe.customers.retrieve(
    subscription.customer as string,
  );
  await prisma.subscription.update({
    where: {
      stripeSubId: subscriptionId,
    },
    data: {
      status: "inactive",
    },
  });

  const userEmail = (customer as any).email;
  const emailTemplate = generateSubscriptionDeletedEmail(subscriptionId);
  await sendMail({
    to: userEmail,
    from: "support",
    subject: emailTemplate.subject,
    template: emailTemplate.body,
    cc: [],
  });
}

export async function handleSubscriptionTrialEnding(event: any) {
  const stripe = getStripeInstance();
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;
  const user = await getUserBySubscription(subscription);
  const customer = (await stripe.customers.retrieve(
    customerId,
  )) as Stripe.Customer;
  const userEmail = customer.email;
  if (!userEmail) {
    loggerServer.error(
      "No email found for customer" +
        " " +
        customerId +
        " In handleSubscriptionTrialEnding",
    );
    return;
  }

  if (!subscription.trial_end) {
    loggerServer.error(
      "No trial end found for subscription" +
        " " +
        subscription.id +
        " In handleSubscriptionTrialEnding",
    );
    return;
  }

  const subscriptionFromDb = await prisma.subscription.findUnique({
    where: {
      stripeSubId: subscription.id,
    },
    select: {
      plan: true,
    },
  });

  if (!subscriptionFromDb) {
    loggerServer.error(
      "No subscription found for user" +
        " " +
        userEmail +
        " In handleSubscriptionTrialEnding",
    );
    return;
  }
  let subject = "";
  let body = "";
  // Send email notification about trial ending
  if (subscription.metadata?.freeTrialCode) {
    const emailTemplate = generateFreeTrialEndingEmail(
      new Date(subscription.trial_end * 1000),
      user?.name || undefined,
    );
    subject = emailTemplate.subject;
    body = emailTemplate.body;
  } else {
    const emailTemplate = generateSubscriptionTrialEndingEmail(
      subscriptionFromDb.plan,
      new Date(subscription.trial_end * 1000),
    );
    subject = emailTemplate.subject;
    body = emailTemplate.body;
  }
  if (subject)
    await sendMail({
      to: userEmail,
      from: "support",
      subject,
      template: body,
      cc: ["orelsmail@gmail.com"],
    });
}

//
export async function handleInvoicePaymentSucceeded(event: any) {
  const invoice = event.data.object as Stripe.Invoice;
  const customerEmail = invoice.customer_email;
  const customerId = invoice.customer as string;

  const customer = await getStripeInstance().customers.retrieve(
    invoice.customer as string,
  );
  const userEmail = (customer as any).email || customerEmail;
  if (!userEmail) {
    loggerServer.error(
      "No email found for customer" +
        " " +
        customerId +
        " In handleInvoicePaymentSucceeded",
    );
    return;
  }

  const user = await prisma.user.findUnique({
    where: {
      email: userEmail,
    },
  });
  if (!user) {
    loggerServer.error(
      "No user found for customer" +
        " " +
        customerId +
        " In handleInvoicePaymentSucceeded",
    );
    return;
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      status: "active",
    },
  });

  if (!subscription) {
    loggerServer.error(
      "No active subscription found for user" +
        " " +
        user.id +
        " In handleInvoicePaymentSucceeded",
    );
    return;
  }

  const newCredits = subscription.isTrialing
    ? subscription.creditsRemaining
    : subscription.creditsPerPeriod + subscription.creditsRemaining;

  await prisma.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      creditsRemaining: newCredits,
      isTrialing: false,
      lastCreditReset: new Date(),
    },
  });

  const currentPeriodEnd = new Date(
    Number(subscription.currentPeriodEnd) * 1000,
  );

  const emailTemplate = generatePaymentConfirmationEmail(
    user.name || "",
    subscription.plan,
    invoice.amount_paid / 100,
    new Date(),
    currentPeriodEnd,
  );

  await sendMail({
    to: userEmail,
    from: "support",
    subject: emailTemplate.subject,
    template: emailTemplate.body,
    cc: ["orelsmail@gmail.com"],
  });
}

export async function handleInvoicePaymentFailed(event: any) {
  const invoice = event.data.object as Stripe.Invoice;
  const customerEmail = invoice.customer_email;
  if (!customerEmail) {
    loggerServer.error(
      "No email found for customer" +
        " " +
        invoice.customer +
        " In handleInvoicePaymentFailed",
    );
    return;
  }

  const emailTemplate = generateInvoicePaymentFailedEmail(
    invoice.id,
    customerEmail,
  );

  await sendMail({
    to: "orelsmail@gmail.com",
    from: "support",
    subject: emailTemplate.subject,
    template: emailTemplate.body,
    cc: [],
  });
}

export async function handleCheckoutSessionCompleted(event: any) {
  const session = event.data.object as Stripe.Checkout.Session;

  // get userId and credits from metadata
  const userId = session.metadata?.userId as string;
  const creditsString = session.metadata?.credits as string;
  const credits = parseInt(creditsString);

  if (!userId || !credits || isNaN(credits)) {
    loggerServer.error(
      "Invalid metadata" +
        " " +
        JSON.stringify(session.metadata) +
        " In handleCheckoutSessionCompleted",
    );
    return;
  }

  const subscription = await getActiveSubscription(userId);
  if (!subscription) {
    loggerServer.error(
      "No subscription found for user" +
        " " +
        userId +
        " In handleCheckoutSessionCompleted",
    );
    return;
  }

  await prisma.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      creditsRemaining: subscription.creditsRemaining + credits,
    },
  });
}
