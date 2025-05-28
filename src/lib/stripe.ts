import { getLookupKey } from "@/lib/utils/plans";
import { Coupon } from "@/types/payment";
import { Plan } from "@prisma/client";
import Stripe from "stripe";
import { Logger } from "@/logger";
import { getUserLatestPayment } from "@/lib/dal/payment";
import { getActiveSubscription } from "@/lib/dal/subscription";

const LAUNCH_COUPON_NAME = "LAUNCH";
const MAX_PERCENT_OFF = 20;
const LAUNCH_EMOJI = "🚀";

export const RETENTION_COUPON_ID = process.env.RETENTION_COUPON_ID as string;
export const RETENTION_PERCENT_OFF = 50;

const appName = process.env.NEXT_PUBLIC_APP_NAME;

export const getStripeInstance = (
  data?:
    | {
        apiKey: string;
        accountId?: string;
      }
    | {
        apiKey?: string;
        accountId: string;
      },
) => {
  const apiVersion = "2025-01-27.acacia";
  if (!data) {
    return new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion });
  }

  const { apiKey, accountId } = data;
  if (accountId) {
    return new Stripe(apiKey || (process.env.STRIPE_SECRET_KEY as string), {
      stripeAccount: accountId,
      apiVersion,
    });
  } else {
    return new Stripe(apiKey as string, { apiVersion });
  }
};

async function findCoupon(stripe: Stripe, month: string) {
  const coupons = await stripe.coupons.list();
  const coupon = coupons.data.find(coupon => coupon.name === month);
  return coupon;
}

async function getOrCreateMonthlyCoupon(stripe: Stripe) {
  const thisMonthName = new Date()
    .toLocaleString("default", {
      month: "long",
    })
    .toUpperCase();

  const existingCoupon = await findCoupon(stripe, thisMonthName);
  if (existingCoupon) {
    return existingCoupon;
  }

  // if between December and February, it's winter, if between March and May, it's spring, if between June and August, it's summer, if between September and November, it's fall
  const season =
    new Date().getMonth() >= 12 || new Date().getMonth() <= 2
      ? "WINTER"
      : new Date().getMonth() >= 3 && new Date().getMonth() <= 5
        ? "SPRING"
        : new Date().getMonth() >= 6 && new Date().getMonth() <= 8
          ? "SUMMER"
          : "FALL";
  const seasonEmoji =
    season === "WINTER"
      ? "🥶"
      : season === "SPRING"
        ? "🌸"
        : season === "SUMMER"
          ? "🌞"
          : "🍂";
  // Find coupon that's called DECEMBER, for example, if it's December
  const coupons = await stripe.coupons.list();
  let coupon = coupons.data.find(
    coupon => coupon.name === thisMonthName && coupon.metadata?.app === appName,
  );
  if (!coupon) {
    coupon = await stripe.coupons.create({
      name: thisMonthName,
      duration: "repeating",
      duration_in_months: 1,
      metadata: {
        month: thisMonthName,
        season,
        seasonEmoji,
        app: appName || "",
      },
      percent_off: MAX_PERCENT_OFF,
    });
  }

  return coupon;
}

export async function getCoupon(
  stripe: Stripe,
  shouldGetLaunch: boolean = true,
): Promise<Coupon | null> {
  const coupons = await stripe.coupons.list();
  const coupon = coupons.data.find(
    coupon =>
      coupon.name === LAUNCH_COUPON_NAME && coupon.metadata?.app === appName,
  );
  let value = coupon;
  if (!value || !shouldGetLaunch) {
    value = await getOrCreateMonthlyCoupon(stripe);
  }
  let redeemBy: number | null = (coupon?.redeem_by || 0) * 1000;
  let timesRedeemed = getTimesRedeemed(value);
  let maxRedemptions = value.max_redemptions;

  if (!isCouponValid(value)) {
    value = await getOrCreateMonthlyCoupon(stripe);
    redeemBy = value.redeem_by;
    timesRedeemed = getTimesRedeemed(value);
    maxRedemptions = value.max_redemptions;
  }

  return {
    id: value.id,
    name: value.name || "",
    percentOff: value.percent_off || 0,
    timesRedeemed,
    maxRedemptions,
    freeTokens: value.metadata?.free_tokens
      ? parseInt(value.metadata.free_tokens)
      : null,
    redeemBy,
    emoji: value.metadata?.seasonEmoji || LAUNCH_EMOJI,
    title: value.metadata?.title || null,
  };
}

export const isCouponValid = (coupon: Stripe.Coupon) => {
  const isRedeemable =
    !coupon.redeem_by ||
    (coupon.redeem_by && coupon.redeem_by * 1000 > new Date().getTime());
  const timesRedeemed = getTimesRedeemed(coupon);

  const isNotExpired =
    !coupon.max_redemptions || timesRedeemed < coupon.max_redemptions;
  return isRedeemable && isNotExpired;
};

export const getTimesRedeemed = (coupon: Stripe.Coupon) => {
  const manualTimesRedeemed = coupon.metadata?.manual_times_redeemed
    ? parseInt(coupon.metadata.manual_times_redeemed)
    : 0;
  return manualTimesRedeemed || coupon.times_redeemed || 0;
};

export const validateSubscriptionWebhookExists = async (stripe: Stripe) => {
  const webhooks = await stripe.webhookEndpoints.list();
  const webhook = webhooks.data.find(
    webhook => webhook.url === process.env.STRIPE_SUBSCRIPTION_WEBHOOK_URL,
  );
  return webhook;
};

export const generateSessionId = async (options: {
  priceId: string;
  productId: string;
  userId: string;
  email: string | null;
  name: string | null;
  urlOrigin: string;
  freeTrial?: number;
  localReferral?: string;
  referralId?: string;
  allowCoupon?: boolean;
}): Promise<string> => {
  const stripe = getStripeInstance();

  const { priceId, productId, urlOrigin, userId, email, name } = options;

  const subscriptionData = options.freeTrial
    ? {
        trial_period_days: options.freeTrial,
      }
    : undefined;

  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],

    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: subscriptionData,
    mode: "subscription",
    success_url: `${urlOrigin}/api/stripe/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${urlOrigin}/cancel`,
    client_reference_id: options.referralId || "",
    customer_email: email || "",
    allow_promotion_codes: options.allowCoupon || false,

    metadata: {
      clientName: name || "",
      productId,
      priceId,
      localReferral: options.localReferral || "",
    },
  });
  return stripeSession.id;
};

export const getPlanPriceId = async (
  stripe: Stripe,
  interval: "month" | "year",
  plan: Plan,
  productId?: string,
) => {
  const products = await stripe.products.list();
  const product = productId
    ? products.data.find(product => product.id === productId)
    : products.data.find(product => product.metadata?.app === appName);
  let priceLookupKey = getLookupKey(plan, interval);

  const prices = await stripe.prices.list({
    product: product?.id,
    recurring: { interval },
    lookup_keys: [priceLookupKey],
  });

  const price = prices.data[0];
  return price?.id;
};

export const cancelSubscription = async (subscriptionId: string) => {
  const stripe = getStripeInstance();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (subscription.status === "active" || subscription.status === "trialing") {
    await stripe.subscriptions.cancel(subscriptionId);
  }
};

export const getStripeSubscription = async (subscriptionId: string) => {
  const stripe = getStripeInstance();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
};

export const getStripeSubscriptionAppliedCoupon = async (subscriptionId: string) => {
  const stripe = getStripeInstance();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription.discount?.coupon;
};

/**
 * Checks if a user is eligible for the retention discount coupon
 * A user is eligible if:
 * 1. They have an active subscription
 * 2. They don't already have the retention coupon applied
 * 3. They are on a trial but have made a payment before
 */
export const shouldApplyRetentionCoupon = async (
  userId: string,
): Promise<boolean> => {
  try {
    const subscription = await getActiveSubscription(userId);
    if (!subscription) {
      return false;
    }

    const subscriptionId = subscription.stripeSubId;
    const payment = await getUserLatestPayment(userId);
    const hasPaymentHistory = !!payment;

    // Check if the user already has the retention coupon applied
    const stripeSubscriptionCoupon = await getStripeSubscriptionAppliedCoupon(subscriptionId);
    if (stripeSubscriptionCoupon?.id === RETENTION_COUPON_ID) {
      return false;
    }

    // If they're on a trial, check if they've made a payment before
    if (subscription.status === "trialing") {
      return hasPaymentHistory;
    }

    // By default, users with active subscriptions are eligible
    return true;
  } catch (error) {
    Logger.error("Error checking retention coupon eligibility:", { error: String(error) });
    return false;
  }
};


export const getRetentionCoupon = async (stripe: Stripe) => {
  const coupon = await stripe.coupons.retrieve(RETENTION_COUPON_ID);
  return coupon;
};
