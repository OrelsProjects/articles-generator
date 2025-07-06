import { prisma } from "@/lib/prisma";
import {
  getActiveSubscription,
  getActiveSubscriptionByStripeSubId,
} from "@/lib/dal/subscription";
import { setFeatureFlagsByPlan } from "@/lib/dal/userMetadata";
import { addTagToEmail, removeTagFromEmail, sendMail } from "@/lib/mail/mail";
import {
  generateFreeSubscriptionEndedEmail,
  generateFreeTrialEndingEmail,
  generateInvoicePaymentFailedEmail,
  generatePaymentConfirmationEmail,
  generateSubscriptionDeletedEmail,
  generateSubscriptionTrialEndingEmail,
} from "@/lib/mail/templates";
import { creditsPerPlan } from "@/lib/plans-consts";
import { getCoupon, getStripeInstance } from "@/lib/stripe";
import { calculateNewPlanCreditsLeft } from "@/lib/utils/credits";
import loggerServer from "@/loggerServer";
import { Interval, Payment, Plan, Subscription } from "@prisma/client";
import { Stripe } from "stripe";
import { applyCoupon, removeCouponUsage } from "@/lib/dal/coupon";

const formatSubscriptionStatus = (status: string) => {
  if (status === "incomplete") {
    return "active";
  }
  return status;
};

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

async function getPlanBySubscription(
  subscription: Stripe.Subscription,
): Promise<Plan | null> {
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

  const newCredits = isFreeSubscription
    ? 10
    : isTrialing // If the subscription is trialing, we add credits here. If not, we add them after the first payment.
      ? creditsPerPlan[plan]
      : 0;

  const interval = (price.recurring?.interval || "month") as Interval;
  let creditsPerPeriod = creditsPerPlan[plan];
  let creditsRemaining = newCredits;

  if (interval === "year") {
    creditsPerPeriod = creditsPerPeriod;
    creditsRemaining = newCredits;
  }

  const subscriptionData = {
    status: formatSubscriptionStatus(subscription.status),
    userId: user?.id,
    plan: plan,
    stripeSubId: subscriptionId,
    startDate: new Date(),
    endDate: null,
    isTrialing: isTrialing,
    trialStart: isTrialing ? new Date() : null,
    trialEnd: isTrialing ? new Date(subscription.trial_end! * 1000) : null,

    // Credits information
    creditsPerPeriod: creditsPerPeriod,
    creditsRemaining: creditsRemaining,
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

  if (user.email) {
    await addTagToEmail(user.email, "writestack-new-subscriber");
  }
  if (subscription.discount?.coupon?.id) {
    try {
      await applyCoupon(subscription.discount.coupon.id, user.id);
    } catch (error) {
      loggerServer.error("Error applying coupon", {
        error,
        couponId: subscription.discount.coupon.id,
        userId: user.id,
      });
    }
  }
}

// Cases when Update is called:
// - Subscription is updated (e.g. trial ends)
// - Subscription is paused
// - Subscription is resumed
// - Subscription is deleted
export async function handleSubscriptionUpdated(event: any) {
  const subscription = event.data.object as Stripe.Subscription;
  const stripe = getStripeInstance();

  const isSubInTrial = subscription.status === "trialing";

  const isSubscriptionCanceled =
    subscription.status === "canceled" ||
    subscription.status === "incomplete_expired" ||
    subscription.status === "incomplete" ||
    subscription.status === "past_due";

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

  const currentSubscription =
    await getActiveSubscriptionByStripeSubId(subscriptionId);

  if (!currentSubscription) {
    loggerServer.error("No subscription found for user", {
      userId: user.id,
    });
    throw new Error("No subscription found for user");
  }
  // trialing
  // If new month, we need to add new credits
  const isTrial = currentSubscription.isTrialing || isSubInTrial;
  const didChangeInterval =
    currentSubscription.interval !== price.recurring?.interval || "month";
  const didChangePlan = currentSubscription.plan !== plan;

  const hasCoupon = subscription.discount?.coupon?.id;
  const promoCode = subscription.discount?.promotion_code;

  if (didChangeInterval && hasCoupon && promoCode) {
    const newInterval = price.recurring?.interval || "month";
    const promotionCodeString =
      typeof promoCode === "string" ? promoCode : promoCode.code;
    const promotionCode =
      await stripe.promotionCodes.retrieve(promotionCodeString);
    const newCoupon = await getCoupon(
      stripe,
      promotionCode.code,
      newInterval as "month" | "year",
    );
    if (newCoupon) {
      // add new coupon
      if (newCoupon.promoId) {
        await stripe.subscriptions.update(subscriptionId, {
          discounts: [{ promotion_code: newCoupon.promoId }],
        });
      } else {
        await stripe.subscriptions.update(subscriptionId, {
          discounts: [{ coupon: newCoupon.id }],
        });
      }
      await prisma.subscription.update({
        where: {
          stripeSubId: subscriptionId,
        },
        data: {
          couponIdApplied: newCoupon.id,
          interval: newInterval as Interval,
        },
      });
    }
  }
  const { id, ...currentSubscriptionNoId } = currentSubscription;

  const newSubscription: Omit<Subscription, "id"> = {
    ...currentSubscriptionNoId,
    plan: plan || currentSubscription.plan,
    status: formatSubscriptionStatus(subscription.status),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    startDate: currentSubscription.startDate,
    endDate: currentSubscription.endDate,
    isTrialing: isSubInTrial,
    trialStart: subscription.trial_start
      ? new Date(subscription.trial_start * 1000)
      : currentSubscription.trialStart,
    trialEnd: subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : currentSubscription.trialEnd,
    interval: (price.recurring?.interval || "month") as Interval,
    couponIdApplied: subscription.discount?.coupon?.id || null,
  };

  if (!isTrial || didChangePlan) {
    const { creditsLeft, creditsForPlan } = await calculateNewPlanCreditsLeft(
      user.id,
      plan,
      currentSubscription,
    );
    newSubscription.creditsPerPeriod = creditsForPlan;
    newSubscription.creditsRemaining = creditsLeft;
  }

  await prisma.subscription.update({
    where: {
      stripeSubId: subscriptionId,
    },
    data: newSubscription,
  });

  // if subscription paused/canceled/delete, remove tag. Otherwise, add
  if (user.email) {
    if (isSubscriptionCanceled) {
      await removeTagFromEmail(user.email, "writestack-new-subscriber");
    } else if (subscription.status === "active") {
      await addTagToEmail(user.email, "writestack-new-subscriber");
    }
  }
  if (isSubscriptionCanceled && subscription.discount?.coupon?.id) {
    await removeCouponUsage(subscription.discount.coupon.id, user.id);
  }
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
      status: formatSubscriptionStatus(subscription.status),
    },
  });
}

// this function is called with a subscription from stripe is cancelled
export async function handleSubscriptionDeleted(event: Stripe.Event) {
  const stripe = getStripeInstance();
  const subscription = event.data.object as Stripe.Subscription;
  const subscriptionId = subscription.id;
  const user = await getUserBySubscription(subscription);
  const plan = await getPlanBySubscription(subscription);

  const customer = await stripe.customers.retrieve(
    subscription.customer as string,
  );
  try {
    await prisma.subscription.update({
      where: {
        stripeSubId: subscriptionId,
      },
      data: {
        status: "inactive",
      },
    });
  } catch (error) {
    loggerServer.error("Error updating subscription", {
      error,
      subscriptionId,
      userId: user?.id || "unknown",
    });
  }

  const userEmail = (customer as any).email;
  const emailTemplate = generateSubscriptionDeletedEmail(
    user?.name || undefined,
    plan?.toString(),
  );
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

  if (!user) {
    loggerServer.error(
      "No user found for subscription" +
        " " +
        subscription.id +
        " In handleSubscriptionTrialEnding",
    );
    return;
  }

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

  const subscriptionFromDb = await getActiveSubscription(user.id);

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
      user?.name || null,
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

  const subscription = await getActiveSubscription(user.id);

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

  const currentPeriodEnd = new Date(Number(subscription.currentPeriodEnd));

  if (invoice.amount_paid > 0) {
    const emailTemplate = generatePaymentConfirmationEmail({
      userName: user.name || "",
      planName: subscription.plan,
      amount: invoice.amount_paid / 100,
      paymentDate: new Date(),
      nextBillingDate: currentPeriodEnd,
      invoiceNumber: invoice.number || undefined,
      currency: invoice.currency || undefined,
    });

    await sendMail({
      to: userEmail,
      from: "support",
      subject: emailTemplate.subject,
      template: emailTemplate.body,
      cc: ["orelsmail@gmail.com"],
    });
  }
}

export async function handleInvoicePaymentFailed(event: any) {
  const invoice = event.data.object as Stripe.Invoice;
  const customerEmail = invoice.customer_email;
  const customerName = invoice.customer_name;
  if (!customerEmail) {
    loggerServer.error(
      "No email found for customer" +
        " " +
        invoice.customer +
        " In handleInvoicePaymentFailed",
    );
    return;
  }

  const customerFirstName = customerName?.split(" ")[0];

  const emailTemplate = generateInvoicePaymentFailedEmail(
    invoice.hosted_invoice_url || "",
    invoice.invoice_pdf || "",
    customerEmail,
    customerFirstName || undefined,
  );
  await sendMail({
    to: customerEmail,
    from: "support",
    subject: emailTemplate.subject,
    template: emailTemplate.body,
    cc: ["orelsmail@gmail.com"],
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
