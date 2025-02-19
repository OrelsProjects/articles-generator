import { authOptions } from "@/auth/authOptions";
import { getStripeInstance } from "@/lib/stripe";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { generateSessionId } from "@/lib/stripe";
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const nextUrl = req.nextUrl;
    const { priceId, productId } = await req.json();

    const sessionId = await generateSessionId({
      priceId,
      productId,
      urlOrigin: nextUrl.origin,
      userId: session.user.id,
      email: session.user.email || null,
      name: session.user.name || null,
    });
    return NextResponse.json({ sessionId }, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Error creating a checkout session", error);
    return NextResponse.json(
      { error: "Error creating a checkout session" },
      { status: 500 },
    );
  }
}
