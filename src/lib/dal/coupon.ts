import { prisma } from "@/lib/prisma";
import { getCoupon, getStripeInstance } from "@/lib/stripe";

export async function isCouponValid(couponCode: string) {
  const coupon = await getCoupon(getStripeInstance(), couponCode);
  return !!coupon;
}

/**
 * Check if coupon has more usages
 * @param couponCode
 * @returns
 */
export async function canUseCoupon(couponCode: string) {
  const coupon = await getCoupon(getStripeInstance(), couponCode);
  if (!coupon) {
    return false;
  }

  const couponUsages = await prisma.couponUsage.count({
    where: { couponCode },
  });
  if (coupon.max_redemptions && coupon.max_redemptions <= couponUsages) {
    return false;
  }
  return true;
}

/**
 * Apply coupon to user
 * @param couponCode
 * @param userId
 * @returns
 */
export async function applyCoupon(couponCode: string, userId: string) {
  const couponUsage = await prisma.couponUsage.create({
    data: { couponCode, userId },
  });
  return couponUsage;
}

/**
 * Remove coupon usage from user
 * @param couponCode
 * @param userId
 * @returns
 */
export async function removeCouponUsage(couponCode: string, userId: string) {
  const couponUsage = await prisma.couponUsage.findUnique({
    where: { couponCode_userId: { couponCode, userId } },
  });
  if (!couponUsage) {
    return false;
  }

  await prisma.couponUsage.delete({
    where: { id: couponUsage.id },
  });

  return couponUsage;
}

/**
 * This function is needed to adjust for the fact that Stripe doesn't support coupons for yearly plans
 * So a coupon that is applied for 3 months, for example, will be applied for 3 months, for yearly plans, it will be applied for 12 months
 * @param couponCode
 * @param plans
 * @returns
 */
export async function getNewPrice(
  couponCode: string,
  plans: {
    name: string;
    price: number;
    interval: "month" | "year";
  }[],
): Promise<
  | {
      name: string;
      discount: number;
      newPrice: number;
      discountDuration: number;
      interval: "month" | "year";
      discountForAnnualPlan?: number;
      priceBeforeDiscount: number;
    }[]
  | null
> {
  const annualCouponCode = couponCode + "YEAR";
  const coupon = await getCoupon(getStripeInstance(), couponCode);
  const annualCoupon = await getCoupon(
    getStripeInstance(),
    annualCouponCode,
    "year",
  );

  if (!coupon) {
    return [];
  }

  const discountMonths = coupon.duration_in_months
    ? coupon.duration_in_months
    : 1;

  const newPrices = plans.map(plan => {
    const price = plan.price;
    const interval = plan.interval;
    const discountPercent = coupon.percent_off;
    if (!discountPercent) {
      return {
        name: plan.name,
        discount: 0,
        discountDuration: 0,
        newPrice: price,
        interval,
        priceBeforeDiscount: price,
      };
    }
    if (interval === "month") {
      return {
        name: plan.name,
        discount: discountPercent,
        discountDuration: discountMonths,
        newPrice: price * (1 - discountPercent / 100),
        interval,
        priceBeforeDiscount: price,
      };
    }

    // Yearly math
    const monthly = price / 12;
    const annualDiscountPercent = annualCoupon?.percent_off || discountPercent;

    let yearCost = price * (1 - annualDiscountPercent / 100);
    if (!couponCode.includes("FLASH") && !couponCode.includes("JOIN")) {
      yearCost = price * (1 - discountPercent / 100);
    }
    // What % of the whole year did we really shave off?
    const effectivePct = +(((price - yearCost) / price) * 100).toFixed(2);

    return {
      name: plan.name,
      newPrice: yearCost,
      discount: discountPercent,
      discountForAnnualPlan: annualCoupon?.percent_off || effectivePct,
      discountDuration: annualCoupon?.duration_in_months || discountMonths,
      interval,
      priceBeforeDiscount: price,
    };
  });

  return newPrices || null;
}
