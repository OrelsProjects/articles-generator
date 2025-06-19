import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { getStripeInstance } from "@/lib/stripe";
import { stripeCouponToCoupon } from "@/types/payment";
import { NextResponse } from "next/server";
import { Stripe } from "stripe";
import { getActiveSubscription } from "@/lib/dal/subscription";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user subscription from database
    const subscription = await getActiveSubscription(userId);

    if (!subscription) {
      return NextResponse.json({
        plan: null,
        nextBillingDate: null,
        interval: null,
        nextPaymentAmount: null,
        originalAmount: null,
        discountedAmount: null,
        coupon: null
      });
    }

    const stripe = getStripeInstance();
    let stripeSubscription = null;
    let stripeCoupon = null;

    // If subscription has stripeSubId, get the subscription details from Stripe
    if (subscription.stripeSubId) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubId
        );

        // Get coupon information if a discount is applied
        if (stripeSubscription.discount && stripeSubscription.discount.coupon) {
          stripeCoupon = stripeSubscription.discount.coupon;
        }
      } catch (error) {
        console.error("Failed to retrieve Stripe subscription:", error);
      }
    }

    // Check if coupon is still valid (for time-limited coupons)
    const couponIsValid = stripeCoupon 
      ? isCouponStillValid(stripeCoupon, stripeSubscription) 
      : false;

    // Get pricing information
    let nextPaymentAmount = null;
    let originalAmount = null;
    let discountedAmount = null;
    
    if (stripeSubscription && stripeSubscription.items.data.length > 0) {
      const price = stripeSubscription.items.data[0].price;
      originalAmount = price?.unit_amount || null;
      
      // Calculate discounted amount if coupon is applied and valid
      if (stripeCoupon && couponIsValid && originalAmount) {
        if (stripeCoupon.percent_off) {
          // Percentage discount
          const discountMultiplier = (100 - stripeCoupon.percent_off) / 100;
          discountedAmount = Math.round(originalAmount * discountMultiplier);
        } else if (stripeCoupon.amount_off) {
          // Fixed amount discount
          discountedAmount = Math.max(0, originalAmount - stripeCoupon.amount_off);
        }
        nextPaymentAmount = discountedAmount;
      } else {
        nextPaymentAmount = originalAmount;
      }
    }

    return NextResponse.json({
      plan: subscription.plan,
      nextBillingDate: stripeSubscription?.current_period_end 
        ? new Date(stripeSubscription.current_period_end * 1000) 
        : null,
      interval: subscription.interval,
      nextPaymentAmount, // Final amount after discount (in cents)
      originalAmount, // Original price before discount (in cents)
      discountedAmount, // Amount after discount applied (in cents)
      coupon: stripeCoupon ? {
        ...stripeCouponToCoupon(stripeCoupon),
        isValid: couponIsValid
      } : null
    });
  } catch (error) {
    console.error("Error fetching billing information:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing information" },
      { status: 500 }
    );
  }
}

// Check if a coupon is still valid based on its terms and the subscription
function isCouponStillValid(
  coupon: Stripe.Coupon, 
  subscription: Stripe.Subscription | null
): boolean {
  // If no subscription, can't validate
  if (!subscription) return false;
  
  // Check if coupon has expired
  if (coupon.redeem_by && coupon.redeem_by * 1000 < Date.now()) {
    return false;
  }
  
  // Check if coupon has limited duration and if we're still in that period
  if (coupon.duration === "repeating" && coupon.duration_in_months) {
    // Calculate when subscription started with this coupon
    const subscriptionStart = subscription.created;
    const now = Math.floor(Date.now() / 1000);
    
    // Calculate how many months have passed
    const msPerMonth = 30 * 24 * 60 * 60; // approximate seconds in a month
    const monthsPassed = Math.floor((now - subscriptionStart) / msPerMonth);
    
    // If more months have passed than the duration, coupon is no longer valid
    if (monthsPassed >= coupon.duration_in_months) {
      return false;
    }
  }
  
  return true;
} 