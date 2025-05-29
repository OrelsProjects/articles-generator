import { prisma } from "@/lib/prisma";
import loggerServer from "@/loggerServer";
import { getCoupon, getStripeInstance } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mail/mail";
import { generateWelcomeTemplateTrial } from "@/lib/mail/templates";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";

export async function GET(
  req: NextRequest,
  { params }: { params: { couponCode: string[] } },
) {
  const userSession = await getServerSession(authOptions);
  if (!userSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const couponCode = params.couponCode;
    if (couponCode && couponCode.length > 0) {
      const stripe = getStripeInstance();
      try {
        await stripe.coupons.del(couponCode[0]);
      } catch (error: any) {
        loggerServer.error("Failed to cancel coupon", {
          error,
          userId: userSession?.user.id,
        });
      }
    }
    return NextResponse.redirect(req.nextUrl.origin + `/pricing`);
  } catch (error: any) {
    loggerServer.error("Failed to complete subscription", {
      error,
      userId: userSession?.user.id,
    });
    return NextResponse.redirect(req.nextUrl.origin + "/pricing?error=true");
  }
}
