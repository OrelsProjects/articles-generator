import loggerServer from "@/loggerServer";
import { Coupon } from "@/types/payment";
import Stripe from "stripe";

const LAUNCH_COUPON_NAME = "LAUNCH";
const MAX_PERCENT_OFF = 20;
const LAUNCH_EMOJI = "🚀";

const appName = process.env.NEXT_PUBLIC_APP_NAME;

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
