import { Plan } from "@prisma/client";

export const getLookupKey = (plan: Plan, interval: "month" | "year") => {
  let priceLookupKey = "";
  if (interval === "month") {
    priceLookupKey =
      plan === "hobbyist"
        ? process.env.STRIPE_PRICING_HOBBYIST_LOOKUP_KEY_MONTHLY || ""
        : plan === "standard"
          ? process.env.STRIPE_PRICING_STANDARD_LOOKUP_KEY_MONTHLY || ""
          : process.env.STRIPE_PRICING_PREMIUM_LOOKUP_KEY_MONTHLY || "";
  } else {
    priceLookupKey =
      plan === "hobbyist"
        ? process.env.STRIPE_PRICING_HOBBYIST_LOOKUP_KEY_YEARLY || ""
        : plan === "standard"
          ? process.env.STRIPE_PRICING_STANDARD_LOOKUP_KEY_YEARLY || ""
          : process.env.STRIPE_PRICING_PREMIUM_LOOKUP_KEY_YEARLY || "";
  }
  return priceLookupKey;
};
