import { authOptions } from "@/auth/authOptions";
import { getActiveSubscription } from "@/lib/dal/subscription";
import loggerServer from "@/loggerServer";
import { AllUsages, SubscriptionInfo } from "@/types/settings";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const subscription = await getActiveSubscription(session.user.id);

    if (!subscription) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data: AllUsages = {
      credits: {
        remaining: subscription.creditsRemaining,
        total: subscription.creditsPerPeriod,
        used: subscription.creditsPerPeriod - subscription.creditsRemaining,
      },
    };
    const subscriptionInfo: SubscriptionInfo = {
    cancelAt: subscription.cancelAtPeriodEnd
      ? new Date(subscription.currentPeriodEnd)
      : undefined,
    };
    return NextResponse.json({
      usages: data,
      subscriptionInfo,
    });
  } catch (error: any) {
    loggerServer.error("Error getting usages", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
