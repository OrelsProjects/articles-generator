// apply retention coupon to subscription

import { authOptions } from "@/auth/authOptions";
import { getActiveSubscription } from "@/lib/dal/subscription";
import { sendMailSafe } from "@/lib/mail/mail";
import { generateSubscriptionCouponAppliedEmail } from "@/lib/mail/templates";
import {
  getRetentionCoupon,
  getStripeInstance,
  shouldApplyRetentionCoupon,
} from "@/lib/stripe";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const canApply = await shouldApplyRetentionCoupon(session.user.id);
    if (!canApply) {
      loggerServer.error("Not eligible", { canApply });
      return NextResponse.json({ error: "Not eligible" }, { status: 400 });
    }

    const subscription = await getActiveSubscription(session.user.id);
    if (!subscription) {
      loggerServer.error("Subscription not found", { subscription });
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    const stripe = getStripeInstance();
    const coupon = await getRetentionCoupon(stripe);

    if (!coupon) {
      loggerServer.error("Coupon not found", { coupon });
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    // apply the coupon to the subscription
    await stripe.subscriptions.update(subscription.stripeSubId, {
      coupon: coupon.id,
    });

    if (coupon.percent_off && session.user.email) {
      const email = generateSubscriptionCouponAppliedEmail(
        session.user.name || "",
        coupon.percent_off,
        coupon.duration_in_months || 1,
      );
      await sendMailSafe({
        to: session.user.email,
        from: "noreply",
        subject: email.subject,
        template: email.body,
        cc: "orelsmail@gmail.com",
      });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    loggerServer.error("Error applying coupon", { error });
    return NextResponse.json(
      { error: "Error applying coupon" },
      { status: 500 },
    );
  }
}
