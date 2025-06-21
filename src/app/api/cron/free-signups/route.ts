import { prisma } from "@/lib/prisma";
import { getStripeInstance } from "@/lib/stripe";
import { MailType } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import cuid from "cuid";
import { generateRegistrationNotCompletedDiscountEmail } from "@/lib/mail/templates";
import {
  addSubscriber,
  addTagToEmail,
  addTagToManyEmails,
  sendMailSafe,
} from "@/lib/mail/mail";

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
  // const usersWithoutSubscriptions = await prisma.userMetadata.findMany({
  //   where: {
  //     user: {
  //       subscription: undefined,
  //     },
  //   },
  // });
  try {
    // const users = await prisma.user.findMany({
    //   include: {
    //     mailsSent: true,
    //     subscription: true,
    //   },
    // });

    // const usersWithoutSubscriptionsIds = users.filter(
    //   user => user.subscription.length <= 0,
    // );

    // const usersSignUpMoreThan3DaysAgo = usersWithoutSubscriptionsIds.filter(
    //   user =>
    //     new Date(user.createdAt).getTime() <
    //     new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).getTime(),
    // );

    // const usersWithoutSubscriptionsAndMailsSent =
    //   usersSignUpMoreThan3DaysAgo.filter(
    //     user =>
    //       !user.mailsSent.some(
    //         mail => mail.type === MailType.registrationNotCompletedDiscount,
    //       ),
    //   );

    // const stripe = getStripeInstance();

    // // Add new promotion code for each user
    // try {
    //   let i = 0;
    //   const failedEmails: string[] = [
    //     "simransharmatools1998@gmail.com",
    //     "wyndo.mitra@gmail.com",
    //     "karenkhine014@gmail.com",
    //     "donsmathblog@gmail.com",
    //     "aperlot@gmail.com",
    //     "alex@reelex.ro",
    //     "steve.huff@gmail.com",
    //     "ducchungit.dev@gmail.com",
    //     "kieron@notpluto.com",
    //     "dailitorial@gmail.com",
    //     "enrique.riesgo@gmail.com",
    //     "daisyfaithauma@gmail.com",
    //     "tiktaalik4u@gmail.com",
    //     "mirenescribeparasanar@gmail.com",
    //     "tonybuct@gmail.com",
    //     "jillpawlik@gmail.com",
    //     "julie@shestartsabusiness.org",
    //     "azhar.laher@gmail.com",
    //     "thomderks@gmail.com",
    //   ];

    //   // const users = await prisma.user.findMany({
    //   //   where: {
    //   //     email: {
    //   //       in: failedEmails,
    //   //     },
    //   //   },
    //   // });

    //   // for (const user of users) {
    //   //   const email = user.email;
    //   //   if (!email) continue;
    //   //   await addSubscriber(email, {
    //   //     fullName: user.name || "",
    //   //   });
    //   //   const result = await addTagToEmail(email, "writestack-no-subscription");
    //   //   if (!result) {
    //   //     console.log(`Failed to add tag to email ${email}`);
    //   //   }
    //   // }
    //   const result = await addTagToEmail(
    //     "orelsmail@gmail.com",
    //     "writestack-no-subscription",
    //   );

    //   for (const user of usersWithoutSubscriptionsAndMailsSent) {
    //     console.log(
    //       `Adding tag to email ${++i} of ${usersWithoutSubscriptionsAndMailsSent.length}`,
    //     );
    //     if (!user.email) continue;
    //     const result = await addTagToEmail(
    //       user.email,
    //       "writestack-no-subscription",
    //     );
    //     if (!result) {
    //       console.log(`Failed to add tag to email ${user.email}`);
    //       failedEmails.push(user.email);
    //     }
    //     const code = "JOIN" + cuid().slice(0, 8);
    //     const codeYear = code + "YEAR";
    //     // await stripe.promotionCodes.create({
    //     //   coupon: FREE_SIGNUP_DISCOUNT_CODE,
    //     //   code,
    //     //   metadata: {
    //     //     userId: user.id,
    //     //   },
    //     // });
    //     // await stripe.promotionCodes.create({
    //     //   coupon: FREE_SIGNUP_DISCOUNT_CODE_YEAR,
    //     //   code: codeYear,
    //     //   metadata: {
    //     //     userId: user.id,
    //     //   },
    //     // });
    //     const template = generateRegistrationNotCompletedDiscountEmail(code);

    //     // await sendMailSafe({
    //     //   to: "orelsmail@gmail.com",
    //     //   subject: template.subject,
    //     //   template: template.body,
    //     //   from: "team",
    //     // });
    //   }
    //   if (failedEmails.length > 0) {
    //     return NextResponse.json({
    //       success: false,
    //       failedEmails,
    //     });
    //   }
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);
  }
  return NextResponse.json({
    success: true,
  });
}
