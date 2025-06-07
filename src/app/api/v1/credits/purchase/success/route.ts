import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripeInstance } from "@/lib/stripe";
import loggerServer from "@/loggerServer";

export async function GET(request: NextRequest) {
  try {
    // This is a success route for the purchase of credits, callback from Stripe
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId || typeof sessionId !== "string") {
      loggerServer.error("[CRITICAL ERROR - ADD CREDITS] Invalid session_id", {
        sessionId,
        userId: "unknown",
      });
      return NextResponse.redirect(
        new URL("/settings?error=true&succeeded=true", request.url),
      );
    }
    const stripe = getStripeInstance();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const credits = session.metadata?.credits;
    const userId = session.metadata?.userId;
    if (!credits || typeof credits !== "string") {
      loggerServer.error("[CRITICAL ERROR - ADD CREDITS] Invalid credits", {
        credits,
        userId: userId || "unknown",
      });
      return NextResponse.redirect(
        new URL("/settings?error=true&succeeded=true", request.url),
      );
    }
    // Update the user's credits
    await prisma.subscription.update({
      where: { id: userId },
      data: {
        creditsRemaining: { increment: Number(credits) },
      },
    });

    return NextResponse.redirect(new URL("/settings", request.url));
  } catch (error) {
    loggerServer.error("[CRITICAL ERROR - ADD CREDITS] Error", {
      error,
      userId: "unknown",
    });
    return NextResponse.redirect(
      new URL("/settings?error=true&succeeded=true", request.url),
    );
  }
}
