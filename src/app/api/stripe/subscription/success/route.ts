import { prisma } from "@/app/api/_db/db";
import loggerServer from "@/loggerServer";
import { getStripeInstance } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mail/mail";
import { generateWelcomeTemplateTrial } from "@/lib/mail/templates";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";

export async function GET(req: NextRequest) {
  const userSession = await getServerSession(authOptions);
  if (!userSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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

    const productId = session.metadata?.productId;
    const priceId = session.metadata?.priceId;

    if (!productId || !priceId) {
      return NextResponse.json(
        { error: "Invalid session_id" },
        { status: 400 },
      );
    }

    const product = await getStripeInstance().products.retrieve(productId);
    const price = await getStripeInstance().prices.retrieve(priceId);

    try {
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
            connect: { id: userSession.user.id },
          },
        },
      });
    } catch (error: any) {
      loggerServer.error(
        "CRITICAL PAYMENT CREATION: Failed to create payment: " + error,
        {
          userId: userSession.user.id,
          sessionId,
          productId,
          priceId,
          productName: product.name,
          status: session.payment_status,
          amountReceived: (price.unit_amount as number) / 100,
        },
      );
    }

    const plan = product.metadata?.plan;

    try {
      const welcomeEmail = generateWelcomeTemplateTrial();
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
    loggerServer.error("Failed to complete subscription", {
      error,
      userId: userSession?.user.id,
    });
    return NextResponse.redirect(req.nextUrl.origin + "/home?error=true");
  }
}
