import Stripe from "stripe";

export const MIN_TOKENS = 500;

export type Event = Stripe.Event;
export type WebhookCreationResponse = Stripe.Response<Stripe.WebhookEndpoint>;
export type EnabledEvent = Stripe.WebhookEndpointCreateParams.EnabledEvent;

export const eventsForSubscriptionWebhook: EnabledEvent[] = [
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.trial_will_end",
  "invoice.payment_failed",
  "checkout.session.expired",
];

const paymentIntentEvents: EnabledEvent[] = [
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
];

export const chargeEvents: EnabledEvent[] = [
  "charge.succeeded",
  "charge.failed",
];

export const subscriptionEvents: EnabledEvent[] = [
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

export const invoiceEvents: EnabledEvent[] = [
  "invoice.payment_failed",
  "invoice.payment_succeeded",
];

// These are the events that are critical to the user's business, and an email will be sent to the customer on failure.
export const criticalEvents: EnabledEvent[] = [
  "charge.succeeded",
  "charge.failed",
  "customer.subscription.created",
  "customer.subscription.updated",
];

export const allEvents: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  ...paymentIntentEvents,
  ...chargeEvents,
  ...subscriptionEvents,
  ...invoiceEvents,
];
export type IntervalType = "yearly" | "monthly";
export type Pricing = Record<IntervalType, PriceStructure>;

export interface PriceStructure {
  id: string;
  price: number;
  priceFormatted: string;
  dollars: number;
  cents: number;
  tokens: number;
  currency: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  noCreditCard?: boolean;
  priceStructure: Pricing;
  features: string[];
  recommended?: boolean;
}

export interface Coupon {
  id: string;
  name: string;
  emoji: string;
  percentOff: number;
  title?: string | null;
  maxRedemptions: number | null;
  timesRedeemed: number | null;
  redeemBy: number | null;

  freeTokens?: number | null;
}

export interface ProductsResponse {
  products: Product[];
  coupon: Coupon;
}

export interface CouponResponse {
  coupon: Stripe.Coupon;
}

export const stripeCouponToCoupon = (coupon: Stripe.Coupon): Coupon => {
  const freeTokens = coupon.metadata?.free_tokens
    ? parseInt(coupon.metadata.free_tokens)
    : null;
  return {
    id: coupon.id,
    name: coupon.name || "",
    emoji: coupon.metadata?.emoji || "",
    percentOff: coupon.percent_off || 0,
    title: coupon.metadata?.title || null,
    maxRedemptions: coupon.max_redemptions || null,
    timesRedeemed: coupon.times_redeemed || null,
    redeemBy: coupon.redeem_by || null,
    freeTokens: freeTokens,
  };
};

export const formatPrice = (
  data: { dollars: number; cents: number } | { priceWithCents: number },
) => {
  let cents = 0;
  let dollars = 0;
  if ("dollars" in data) {
    dollars = data.dollars;
    cents = data.cents;
  } else {
    dollars = Math.floor(data.priceWithCents / 100);
    cents = data.priceWithCents % 10;
  }
  if (cents > 0) {
    return `${dollars}.${cents}`;
  }
  return `${dollars}`;
};
