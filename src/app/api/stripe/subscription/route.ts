import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { getStripeInstance } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/api/_db/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const stripe = getStripeInstance();
    const products = stripe.products.list();
  } catch (error: any) {
    loggerServer.error("Error getting webhook details", error);
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        OR: [
          { status: "active" },
          { 
            status: "canceled",
            currentPeriodEnd: { gt: new Date() }
          }
        ]
      },
      select: {
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        status: true,
        plan: true
      }
    });

    if (!subscription) {
      return NextResponse.json(null);
    }

    return NextResponse.json(subscription);
  } catch (error: any) {
    loggerServer.error("Error fetching subscription details", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
