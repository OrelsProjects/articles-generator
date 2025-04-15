import prisma from "@/app/api/_db/db";
import loggerServer from "@/loggerServer";
import { getStripeInstance } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import { Plan } from "@prisma/client";
import { sendMail } from "@/lib/mail/mail";
import {
  generatePaymentConfirmationEmail,
  welcomeTemplate,
} from "@/lib/mail/templates";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  }
  try {
    const stripe = getStripeInstance();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Invalid session_id" },
        { status: 400 },
      );
    }

    const userId = session.client_reference_id;
    const productId = session.metadata?.productId;
    const priceId = session.metadata?.priceId;

    if (!userId || !productId || !priceId) {
      return NextResponse.json(
        { error: "Invalid session_id" },
        { status: 400 },
      );
    }

    const product = await getStripeInstance().products.retrieve(productId);
    const price = await getStripeInstance().prices.retrieve(priceId);

    await prisma.payment.create({
      data: {
        sessionId,
        productId,
        priceId,
        productName: product.name,
        status: session.payment_status,
        amountReceived: (price.unit_amount as number) / 100,
        currency: price.currency as string,
        user: {
          connect: { id: userId },
        },
      },
    });

    const plan = product.metadata?.plan;

    try {
      const paymentEmail = generatePaymentConfirmationEmail(
        session.customer_details?.name || "",
        plan,
        (price.unit_amount as number) / 100,
      );
      const welcomeEmail = welcomeTemplate();

      await sendMail({
        to: session.customer_email || "",
        from: "support",
        subject: paymentEmail.subject,
        template: paymentEmail.body,
        cc: ["orelsmail@gmail.com"],
      });
      // send welcome email as well
      await sendMail({
        to: session.customer_email || "",
        from: "welcome",
        subject: welcomeEmail.subject,
        template: welcomeEmail.body,
        cc: ["orelsmail@gmail.com"],
      });
    } catch (error: any) {
      loggerServer.error("Failed to send welcome email", error);
    }

    return NextResponse.redirect(
      req.nextUrl.origin + `/home?success=true&plan=${plan}`,
    );
  } catch (error: any) {
    loggerServer.error("Failed to complete subscription", error);
    return NextResponse.redirect(req.nextUrl.origin + "/home?error=true");
  }
}
