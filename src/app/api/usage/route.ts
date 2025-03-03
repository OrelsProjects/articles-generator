import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { getUsages, trackAIUsage } from "@/lib/dal/usage";
import { AIUsageType, Plan } from "@prisma/client";
import { creditsPerPlan } from "@/lib/plans-consts";
import prisma from "@/app/api/_db/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const plan = session.user.meta?.plan as Plan || "free";
    const usages = await getUsages(session.user.id, plan);
    return NextResponse.json(usages);
  } catch (error) {
    console.error("Error getting usages:", error);
    return NextResponse.json(
      { error: "Failed to get usages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type } = await req.json();
    if (!type || !Object.values(AIUsageType).includes(type as AIUsageType)) {
      return NextResponse.json(
        { error: "Invalid usage type" },
        { status: 400 }
      );
    }

    const plan = session.user.meta?.plan as Plan || "free";
    const result = await trackAIUsage(
      session.user.id, 
      plan, 
      type as AIUsageType,
      `API usage: ${type}`
    );
    
    if (!result) {
      return NextResponse.json(
        { error: "Not enough credits for this operation" },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking AI usage:", error);
    return NextResponse.json(
      { error: "Failed to track AI usage" },
      { status: 500 }
    );
  }
}

// New endpoint to reset credits for a user
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        Subscription: true,
        userMetadata: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the plan for the user
    const activeSubscription = user.Subscription?.[0];
    const planName = activeSubscription?.plan || "free";
    const planKey = planName.toLowerCase() as keyof typeof creditsPerPlan;
    const creditsForPlan = creditsPerPlan[planKey] || creditsPerPlan.free;

    // Update the user's credits
    await prisma.userMetadata.update({
      where: { userId: user.id },
      data: { credits: creditsForPlan },
    });

    // Update the subscription's credit information
    if (activeSubscription) {
      await prisma.subscription.update({
        where: { id: activeSubscription.id },
        data: {
          creditsRemaining: creditsForPlan,
          creditsPerPeriod: creditsForPlan,
          lastCreditReset: new Date(),
        },
      });
    }

    return NextResponse.json({ 
      success: true,
      credits: creditsForPlan
    });
  } catch (error) {
    console.error("Error resetting credits:", error);
    return NextResponse.json(
      { error: "Failed to reset credits" },
      { status: 500 }
    );
  }
} 