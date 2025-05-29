import { getLookupKey } from "@/lib/utils/plans";
import { Coupon } from "@/types/payment";
import { Plan } from "@prisma/client";
import Stripe from "stripe";
import { Logger } from "@/logger";
import { getUserLatestPayment } from "@/lib/dal/payment";
import { getActiveSubscription } from "@/lib/dal/subscription";
import { getNewPrice } from "@/lib/dal/coupon";
import slugify from "slugify";
const LAUNCH_COUPON_NAME = "LAUNCH";
const MAX_PERCENT_OFF = 20;
const LAUNCH_EMOJI = "🚀";

export const RETENTION_COUPON_ID = process.env.RETENTION_COUPON_ID as string;
export const RETENTION_PERCENT_OFF = 50;

const appName = process.env.NEXT_PUBLIC_APP_NAME;

const generateNewCouponCode = (data: {
  userId: string;
  name?: string;
  email?: string;
  couponCode: string;
}) => {
  const now = new Date().getTime().toString();
  const { userId, name, email, couponCode } = data;
  return slugify(
    `${name || email || userId}-${couponCode}-${now.slice(4, 8)}`,
    {
      lower: true,
      strict: true,
      locale: "en",
      trim: true,
    },
  );
};
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
  promoCode: string,
): Promise<Stripe.Coupon | null> {
  const promotionCodes = await stripe.promotionCodes.list({
    code: promoCode,
    limit: 1,
    expand: ["data.coupon"], // so you get the full coupon object
  });

  if (!promotionCodes.data.length) {
    throw new Error(`Promotion code '${promoCode}' not found`);
  }

  const promo = promotionCodes.data[0];
  const coupon = promo.coupon;
  if (!coupon) {
    return null;
  }

  return coupon;
}

export const isCouponValid = async (coupon: Stripe.Coupon | string) => {
  let couponToCheck: Stripe.Coupon;
  if (typeof coupon === "string") {
    const stripe = getStripeInstance();
    couponToCheck = await stripe.coupons.retrieve(coupon);
  } else {
    couponToCheck = coupon;
  }

  const isRedeemable =
    !couponToCheck.redeem_by ||
    (couponToCheck.redeem_by &&
      couponToCheck.redeem_by * 1000 > new Date().getTime());
  const timesRedeemed = getTimesRedeemed(couponToCheck);

  const isNotExpired =
    !couponToCheck.max_redemptions ||
    timesRedeemed < couponToCheck.max_redemptions;
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
  couponCode?: string;
}): Promise<string> => {
  const stripe = getStripeInstance();
  let newCouponId: string | null = null;
  let newCouponCode: string | null = null;
  try {
    const { priceId, productId, urlOrigin, userId, email, name, couponCode } =
      options;

    const subscriptionData = options.freeTrial
      ? {
          trial_period_days: options.freeTrial,
        }
      : undefined;

    let discountPercent: number | null = null;
    const price = await stripe.prices.retrieve(priceId);
    const coupon = couponCode ? await getCoupon(stripe, couponCode) : null;
    const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];

    if (coupon && couponCode && price.unit_amount) {
      if (price.recurring?.interval === "year") {
        const newPrices = await getNewPrice(couponCode, [
          {
            name: "",
            price: price.unit_amount / 100,
            interval: "year",
          },
        ]);
        discountPercent = newPrices?.[0]?.discountForAnnualPlan || null;
        if (discountPercent) {
          newCouponCode = generateNewCouponCode({
            userId,
            name: name || undefined,
            email: email || undefined,
            couponCode,
          });
          const newCoupon = await stripe.coupons.create({
            id: newCouponCode,
            name: newCouponCode,
            duration: "once",
            ...(discountPercent && { percent_off: discountPercent }),
          });
          discounts.push({
            coupon: newCoupon.id,
          });
          newCouponId = newCoupon.id;
        } else {
          discounts.push({
            coupon: coupon.id,
          });
        }
      } else {
        discounts.push({
          coupon: coupon.id,
        });
      }
    }

    let cancelUrlBase = `${urlOrigin}/api/stripe/subscription/cancel`;
    if (newCouponCode) {
      cancelUrlBase += `/${newCouponCode}`;
    }
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      discounts,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: subscriptionData,
      mode: "subscription",
      success_url: `${urlOrigin}/api/stripe/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrlBase,
      client_reference_id: options.referralId || "none",
      customer_email: email || "",

      metadata: {
        couponApplied: couponCode || null,
        clientName: name || "",
        productId,
        priceId,
        localReferral: options.localReferral || "",
      },
    });
    return stripeSession.id;
  } catch (error) {
    if (newCouponId) {
      await stripe.coupons.del(newCouponId);
    }
    throw error;
  }
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

export const getStripeSubscriptionAppliedCoupon = async (
  subscriptionId: string,
) => {
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
    const stripeSubscriptionCoupon =
      await getStripeSubscriptionAppliedCoupon(subscriptionId);
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
    Logger.error("Error checking retention coupon eligibility:", {
      error: String(error),
    });
    return false;
  }
};

export const getRetentionCoupon = async (stripe: Stripe) => {
  const coupon = await stripe.coupons.retrieve(RETENTION_COUPON_ID);
  return coupon;
};
