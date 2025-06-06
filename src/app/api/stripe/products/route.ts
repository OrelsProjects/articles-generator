import { getCoupon, getStripeInstance } from "@/lib/stripe";
import loggerServer from "@/loggerServer";
import { formatPrice, Pricing, Product } from "@/types/payment";
import { NextRequest, NextResponse } from "next/server";

// revalidate always
export const revalidate = 0;

const appName = process.env.NEXT_PUBLIC_APP_NAME as string;

export async function GET(req: NextRequest) {
  try {
    const stripe = getStripeInstance();
    const { data: stripeProducts } = await stripe.products.list();

    const products: Product[] = [];

    const appProducts = stripeProducts
      .filter(stripeProduct => stripeProduct.active)
      .filter(stripeProduct =>
        stripeProduct.metadata.app
          ?.toLowerCase()
          .includes(appName.toLowerCase()),
      );

    for (const stripeProduct of appProducts) {
      const { data: priceData } = await stripe.prices.list({
        product: stripeProduct.id,
      });
      const stripePrices = priceData.filter(
        stripePrice => stripePrice.active && stripePrice.unit_amount,
      );

      const priceMonthly = stripePrices.find(
        price => price.recurring?.interval === "month",
      );
      const priceYearly = stripePrices.find(
        price => price.recurring?.interval === "year",
      );

      if (!priceMonthly || !priceYearly) {
        return;
      }

      const priceMonthlyValue = priceMonthly.unit_amount || 0;
      const priceYearlyValue = priceYearly.unit_amount || 0;

      const priceYearlyPerMonth = (priceYearlyValue / 12 / 100).toFixed(2);
      const priceMonthlyDollars = priceMonthlyValue / 100;
      const priceYearlyDollars = priceYearlyValue / 100;

      const priceMonthlyCents = priceMonthlyValue % 100;
      const priceYearlyCents = priceYearlyValue % 100;

      const priceStructure: Pricing = {
        month: {
          id: priceMonthly.id,
          currency: priceMonthly.currency,
          price: priceMonthlyValue,
          dollars: priceMonthlyDollars,
          cents: priceMonthlyCents,
          tokens: parseInt(stripeProduct.metadata.tokens),
          perMonth: priceMonthlyDollars,
          priceFormatted: formatPrice({
            priceWithCents: priceMonthlyValue,
          }),
        },
        year: {
          id: priceYearly.id,
          currency: priceYearly.currency,
          price: priceYearlyValue,
          dollars: priceYearlyDollars,
          cents: priceYearlyCents,
          tokens: parseInt(stripeProduct.metadata.tokens),
          perMonth: parseFloat(priceYearlyPerMonth),
          priceFormatted: formatPrice({
            priceWithCents: priceYearlyValue,
          }),
        },
      };

      const product: Product = {
        id: stripeProduct.id,
        name: stripeProduct.name,
        description: stripeProduct.description || stripeProduct.name,
        priceStructure,
        noCreditCard: stripeProduct.metadata.noCreditCard === "true",
        features: stripeProduct.marketing_features.map(
          feature => feature.name || "",
        ),
        recommended: stripeProduct.metadata.recommended === "true",
      };
      products.push(product);
    }

    const productsSortedByPrice = products.sort(
      (a, b) =>
        a.priceStructure.month.price - b.priceStructure.month.price,
    );

    return NextResponse.json(
      { products: productsSortedByPrice },
      { status: 200 },
    );
  } catch (error: any) {
    loggerServer.error("Error getting products", {
      error,
      userId: "none"
    });
    return NextResponse.json(
      { error: "Error getting products" },
      { status: 500 },
    );
  }
}
