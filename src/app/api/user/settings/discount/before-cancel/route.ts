// If user does not have any payment before cancel, we should offer 50% off on cancel

import { authOptions } from "@/auth/authOptions";
import { shouldApplyRetentionCoupon } from "@/lib/stripe";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const isEligible = await shouldApplyRetentionCoupon(session.user.id);

    return NextResponse.json(
      { isDiscountAvailable: isEligible },
      { status: 200 },
    );
  } catch (error: any) {
    loggerServer.error("Error getting discount before cancel", { error });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
