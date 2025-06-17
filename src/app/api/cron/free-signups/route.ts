import { prisma } from "@/lib/prisma";
import { getStripeInstance } from "@/lib/stripe";
import { MailType } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import cuid from "cuid";
import { generateRegistrationNotCompletedDiscountEmail } from "@/lib/mail/templates";
import { sendMailSafe } from "@/lib/mail/mail";

const FREE_SIGNUP_DISCOUNT_CODE = process.env
  .FREE_SIGNUP_DISCOUNT_CODE as string;
const FREE_SIGNUP_DISCOUNT_CODE_YEAR = process.env
  .FREE_SIGNUP_DISCOUNT_CODE_YEAR as string;

export async function GET() {
//   const template = generateRegistrationNotCompletedDiscountEmail("test");
//   await sendMailSafe({
//     to: "orelsmail@gmail.com",
//     subject: template.subject,
//     template: template.body,
//     from: "team",
//   });
  const usersWithoutSubscriptions = await prisma.userMetadata.findMany({
    where: {
      user: {
        subscription: undefined,
      },
    },
  });

  const users = await prisma.user.findMany({
    include: {
      mailsSent: true,
      subscription: true,
    },
  });

  const usersWithoutSubscriptionsIds = users.filter(
    user => user.subscription.length <= 0,
  );

  const usersSignUpMoreThan3DaysAgo = usersWithoutSubscriptionsIds.filter(
    user =>
      new Date(user.createdAt).getTime() <
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).getTime(),
  );

  const usersWithoutSubscriptionsAndMailsSent =
    usersSignUpMoreThan3DaysAgo.filter(
      user =>
        !user.mailsSent.some(
          mail => mail.type === MailType.registrationNotCompletedDiscount,
        ),
    );

  const stripe = getStripeInstance();

  // Add new promotion code for each user
  try {
    for (const user of usersWithoutSubscriptionsAndMailsSent) {
      if (!user.email) continue;
      const code = "JOIN" + cuid().slice(0, 8);
      const codeYear = code + "YEAR";
      await stripe.promotionCodes.create({
        coupon: FREE_SIGNUP_DISCOUNT_CODE,
        code,
        metadata: {
          userId: user.id,
        },
      });
      await stripe.promotionCodes.create({
        coupon: FREE_SIGNUP_DISCOUNT_CODE_YEAR,
        code: codeYear,
        metadata: {
          userId: user.id,
        },
      });
      const template = generateRegistrationNotCompletedDiscountEmail(code);
      await sendMailSafe({
        to: "orelsmail@gmail.com",
        subject: template.subject,
        template: template.body,
        from: "team",
      });
    }
  } catch (error) {
    console.error(error);
  }
  return NextResponse.json(usersWithoutSubscriptionsAndMailsSent);
}
