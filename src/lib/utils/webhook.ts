import prisma from "@/app/api/_db/db";
import { getActiveSubscription } from "@/lib/dal/subscription";
import { setFeatureFlagsByPlan } from "@/lib/dal/userMetadata";
import { addUserToList, sendMail } from "@/lib/mail/mail";
import {
  generateInvoicePaymentFailedEmail,
  generateSubscriptionDeletedEmail,
  generateSubscriptionTrialEndingEmail,
  welcomeTemplate,
} from "@/lib/mail/templates";
import { creditsPerPlan } from "@/lib/plans-consts";
import { getStripeInstance } from "@/lib/stripe";
import { calculateNewPlanCreditsLeft } from "@/lib/utils/credits";
import loggerServer from "@/loggerServer";
import { Payment, Plan, Subscription } from "@prisma/client";
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
  const existingSubscription = await prisma.subscription.findUnique({
    where: {
      stripeSubId: subscription.id,
      status: "active",
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
  const isTrialing = subscription.status === "trialing";
  const isFreeSubscription = subscription.metadata?.isFreeSubscription;
  const plan: Plan = product.metadata?.plan as Plan;
  if (!user) {
    loggerServer.error("No user found for subscription", {
      subscription: `${JSON.stringify(subscription)}`,
    });
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
      creditsRemaining: newCredits + priorCredits,
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
  const plan = await getPlanBySubscription(subscription);
  const user = await getUserBySubscription(subscription);
  if (!user) {
    loggerServer.error("No user found for subscription", {
      subscription: `${JSON.stringify(subscription)}`,
    });
    throw new Error("No user found for subscription");
  }

  if (!plan) {
    loggerServer.error("No plan found for subscription", {
      subscription: `${JSON.stringify(subscription)}`,
    });
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
  };

  await prisma.subscription.update({
    where: {
      stripeSubId: subscriptionId,
    },
    data: newSubscription,
  });

  if (user.email) {
    await sendMail({
      to: user.email!,
      from: "Orel from WriteRoom 👋",
      subject: "Subscription Updated",
      template: welcomeTemplate(user.name || undefined),
      cc: [],
    });
  }
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
      stripeSubId: subscriptionId,
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
      stripeSubId: subscriptionId,
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
      stripeSubId: subscriptionId,
    },
    data: {
      status: "inactive",
    },
  });

  const userEmail = (customer as any).email;
  await sendMail({
    to: userEmail,
    from: "Orel from WriteRoom 👋",
    subject: "Subscription Deleted",
    template: generateSubscriptionDeletedEmail(subscriptionId),
    cc: [],
  });
}

export async function handleSubscriptionTrialEnding(event: any) {
  const stripe = getStripeInstance();
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;
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
  // Send email notification about trial ending
  await sendMail({
    to: userEmail,
    from: "Orel from WriteRoom 👋",
    subject: "Your Trial is Ending Soon",
    template: generateSubscriptionTrialEndingEmail(
      subscriptionFromDb.plan,
      new Date(subscription.trial_end * 1000),
    ),
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

  const payment: Omit<Payment, "id"> = {
    invoiceId: invoice.id,
    amountReceived: invoice.amount_paid,
    currency: invoice.currency,
    status: "succeeded",
    userId: user.id,
    paymentMethodId: null,
    priceId: null,
    sessionId: null,
    productId: null,
    productName: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await prisma.payment.create({
    data: payment,
  });

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
  await sendMail({
    to: "orelsmail@gmail.com",
    from: "Orel from WriteRoom 👋",
    subject: "Payment Failed",
    template: generateInvoicePaymentFailedEmail(invoice.id, customerEmail),
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
