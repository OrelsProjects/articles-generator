import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { getUsages, trackAIUsage } from "@/lib/dal/usage";
import { AIUsageType, Plan } from "@prisma/client";
import { checkAndResetCredits } from "@/lib/services/creditService";

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
    if (!session.user.id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use the credit service to check and reset credits
    const updatedCredits = await checkAndResetCredits(session.user.id);

    return NextResponse.json({ 
      success: true,
      credits: updatedCredits
    });
  } catch (error) {
    console.error("Error resetting credits:", error);
    return NextResponse.json(
      { error: "Failed to reset credits" },
      { status: 500 }
    );
  }
} 