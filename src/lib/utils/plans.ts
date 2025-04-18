import { Plan } from "@prisma/client";

const STRIPE_PRICING_HOBBYIST_LOOKUP_KEY_MONTHLY = "hobbyist_monthly_v1";
const STRIPE_PRICING_HOBBYIST_LOOKUP_KEY_YEARLY = "hobbyist_yearly_v1";
const STRIPE_PRICING_STANDARD_LOOKUP_KEY_MONTHLY = "standard_monthly_v1";
const STRIPE_PRICING_STANDARD_LOOKUP_KEY_YEARLY = "standard_yearly_v1";
const STRIPE_PRICING_PREMIUM_LOOKUP_KEY_MONTHLY = "premium_monthly_v1";
const STRIPE_PRICING_PREMIUM_LOOKUP_KEY_YEARLY = "premium_yearly_v1";

export const getLookupKey = (plan: Plan, interval: "month" | "year") => {
  let priceLookupKey = "";
  if (interval === "month") {
    priceLookupKey =
      plan === "hobbyist"
        ? STRIPE_PRICING_HOBBYIST_LOOKUP_KEY_MONTHLY
        : plan === "standard"
          ? STRIPE_PRICING_STANDARD_LOOKUP_KEY_MONTHLY
          : STRIPE_PRICING_PREMIUM_LOOKUP_KEY_MONTHLY;
  } else {
    priceLookupKey =
      plan === "hobbyist"
        ? STRIPE_PRICING_HOBBYIST_LOOKUP_KEY_YEARLY
        : plan === "standard"
          ? STRIPE_PRICING_STANDARD_LOOKUP_KEY_YEARLY
          : STRIPE_PRICING_PREMIUM_LOOKUP_KEY_YEARLY;
  }
  return priceLookupKey;
};
