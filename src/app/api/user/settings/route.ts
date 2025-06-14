import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import { getActiveSubscription } from "@/lib/dal/subscription";
import loggerServer from "@/loggerServer";
import { AllUsages, SubscriptionInfo } from "@/types/settings";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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

    const settings = await prisma.settings.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      usages: data,
      subscriptionInfo,
      settings,
    });
  } catch (error: any) {
    loggerServer.error("Error getting usages", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

const updateSettingsSchema = z.object({
  onboardingSeen: z.boolean().optional(),
  generatingDescription: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = updateSettingsSchema.parse(body);

    // Check if settings record exists for user
    let settings = await prisma.settings.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (settings) {
      // Update existing settings
      settings = await prisma.settings.update({
        where: {
          userId: session.user.id,
        },
        data: validatedData,
      });
    } else {
      // Create new settings record
      settings = await prisma.settings.create({
        data: {
          userId: session.user.id,
          ...validatedData,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      loggerServer.error("Invalid settings data", {
        error: error.errors,
        userId: session.user.id,
      });
      return NextResponse.json(
        { error: "Invalid settings data" },
        { status: 400 },
      );
    }

    loggerServer.error("Error updating settings", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
