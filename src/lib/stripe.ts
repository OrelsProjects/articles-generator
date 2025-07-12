import { getLookupKey } from "@/lib/utils/plans";
import { Plan } from "@prisma/client";
import Stripe from "stripe";
import { Logger } from "@/logger";
import { getUserLatestPayment } from "@/lib/dal/payment";
import { getActiveSubscription } from "@/lib/dal/subscription";
import slugify from "slugify";

export const RETENTION_COUPON_ID = process.env.RETENTION_COUPON_ID as string;
export const RETENTION_COUPON_ID_YEAR = process.env
  .RETENTION_COUPON_ID_YEAR as string;
export const RETENTION_PROMO_CODE = process.env.RETENTION_PROMO as string;
export const RETENTION_PROMO_CODE_YEAR = process.env
  .RETENTION_PROMO_YEAR as string;
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

export async function getCoupon(
  stripe: Stripe,
  promoCode: string,
  interval: "month" | "year" = "month",
): Promise<(Stripe.Coupon & { promoId?: string }) | null> {
  let promoCodeValid = promoCode;
  const isPromoCodeAnnual = promoCode.includes("YEAR");
  if (interval === "year" && !isPromoCodeAnnual) {
    promoCodeValid = `${promoCode}YEAR`;
  }
  if (interval === "month" && isPromoCodeAnnual) {
    promoCodeValid = promoCode.replace("YEAR", "");
  }
  const promotionCodes = await stripe.promotionCodes.list({
    code: promoCodeValid,
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

  return { ...coupon, promoId: promo.id };
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

    const price = await stripe.prices.retrieve(priceId);
    const interval = price.recurring?.interval || "month";

    const subscriptionData = options.freeTrial
      ? {
          trial_period_days: options.freeTrial,
        }
      : undefined;

    const coupon = couponCode
      ? await getCoupon(stripe, couponCode, interval as "month" | "year")
      : null;
    const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];

    if (coupon && couponCode) {
      if (coupon.promoId) {
        discounts.push({
          promotion_code: coupon.promoId,
        });
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

export const getStripeSubscriptionAppliedCoupons = async (
  subscriptionId: string,
) => {
  const stripe = getStripeInstance();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["discounts"],
  });
  return subscription.discounts?.map(discount => discount as Stripe.Discount);
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
    const stripe = getStripeInstance();

    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubId,
    );
    const stripeCustomer = await stripe.customers.retrieve(
      stripeSubscription.customer as string,
    );

    const invoices = await stripe.invoices.list({
      customer: stripeCustomer.id,
      limit: 100,
    });

    const invoicesWithCoupons = invoices.data.filter(
      invoice =>
        invoice.discount || invoice.total_discount_amounts?.length || 0 > 0,
    );

    for (const invoice of invoicesWithCoupons) {
      if (
        invoice.discount?.coupon?.id === RETENTION_COUPON_ID ||
        invoice.discount?.coupon?.id === RETENTION_COUPON_ID_YEAR
      ) {
        return false;
      }
    }

    return true;
  } catch (error) {
    Logger.error("Error checking retention coupon eligibility:", {
      error: String(error),
    });
    return false;
  }
};

export const getRetentionCoupon = async (
  stripe: Stripe,
  interval: "month" | "year",
) => {
  const promoCode =
    interval === "year" ? RETENTION_PROMO_CODE_YEAR : RETENTION_PROMO_CODE;
  const coupon = await getCoupon(stripe, promoCode, interval);
  return coupon;
};

export async function getCardLast4(chargeId: string | Stripe.Charge | null) {
  if (!chargeId) {
    return null;
  }
  const stripe = getStripeInstance();
  try {
    let charge: Stripe.Charge;
    if (typeof chargeId === "string") {
      charge = await stripe.charges.retrieve(chargeId);
    } else {
      charge = chargeId;
    }

    if (
      charge.payment_method_details &&
      charge.payment_method_details.type === "card" &&
      charge.payment_method_details.card
    ) {
      const last4 = charge.payment_method_details.card.last4;
      return last4;
    } else {
      return null;
    }
  } catch (err) {
    console.error("Error retrieving charge:", err);
    return null;
  }
}
