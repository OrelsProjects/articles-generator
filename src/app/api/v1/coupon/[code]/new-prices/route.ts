import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canUseCoupon } from "@/lib/dal/coupon";
import loggerServer from "@/loggerServer";
import { isCouponValid, getNewPrice } from "@/lib/dal/coupon";

const bodySchema = z.object({
  plans: z.array(
    z.object({
      name: z.string(),
      price: z.number(),
      interval: z.enum(["month", "year"]),
    }),
  ),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } },
) {
  const body = await request.json();
  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    loggerServer.error("Error parsing body", {
      error: parsedBody.error,
      userId: "unknown",
    });
    return NextResponse.json(
      { error: "Something went wrong. Try again later." },
      { status: 400 },
    );
  }

  const { code } = params;
  const { plans } = parsedBody.data;

  const couponValid = await isCouponValid(code);
  if (!couponValid) {
    return NextResponse.json(
      { error: "Incorrect coupon code" },
      { status: 403 },
    );
  }

  const isCouponAvailable = await canUseCoupon(code);
  if (!isCouponAvailable) {
    loggerServer.warn("Tried to get unavailable coupon", {
      code,
      userId: "unknown",
    });
    return NextResponse.json(
      { error: "Coupon not available" },
      { status: 403 },
    );
  }

  let newPrices = await getNewPrice(code, plans);
  if (code.includes("FLASH")) {
    newPrices =
      newPrices?.map(plan => (
        {
        ...plan,
        newPrice: plan.priceBeforeDiscount * 0.7,
      })) || [];
  }
  return NextResponse.json({ newPrices }, { status: 200 });
}
