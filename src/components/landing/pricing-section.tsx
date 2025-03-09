"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { useAppSelector } from "@/lib/hooks/redux";
import { cn } from "@/lib/utils";
import usePayments from "@/lib/hooks/usePayments";
import PriceContainer from "@/components/ui/price-container";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const pricingPlans = [
  {
    name: "Standard",
    description:
      "The essentials to start building your Substack business today.",
    monthlyPrice: 29.99,
    yearlyPlanPrice: 23.99,
    features: [
      "50 Post Writing AI Credits",
      "Up to 20 Followed Accounts",
      "5 Collab Conversation Credits",
      "Streamlined Inbox for Engagement",
      "4m+ Post Inspirational Content Database",
      "Unlimited AI Comment Credits*",
      "Content Analytics & Statistics",
      "Top Leads",
    ],
    annualSavings: 71.98,
    popular: false,
  },
  {
    name: "Premium",
    description:
      "Scale your Substack presence and business. Ideal for accounts looking to grow.",
    monthlyPrice: 49.99,
    yearlyPlanPrice: 39.99,
    features: [
      "100 Post Writing AI Credits/Month",
      "Up to 40 Followed Accounts",
      "15 Collab Conversation Credits",
      "Streamlined Inbox for Engagement",
      "4m+ Post Inspirational Content Database",
      "Unlimited AI Comment Credits*",
      "Content Analytics & Statistics",
      "Top Leads",
    ],
    annualSavings: 119.98,
    popular: true,
  },
  {
    name: "Executive",
    description:
      "Supercharge your Substack activity. Ideal for large, active accounts.",
    monthlyPrice: 99.99,
    yearlyPlanPrice: 79.99,
    features: [
      "150 Post Writing AI Credits/Month",
      "Up to 60 Followed Accounts",
      "40 Collab Conversation Credits",
      "Streamlined Inbox for Engagement",
      "4m+ Post Inspirational Content Database",
      "Unlimited AI Comment Credits*",
      "Content Analytics & Statistics",
      "Top Leads",
    ],
    annualSavings: 239.98,
    popular: false,
  },
];

export default function Pricing({ className }: { className?: string }) {
  const [billingCycle, setBillingCycle] = useState<"month" | "year">("year");
  const router = useCustomRouter();
  const { user } = useAppSelector(state => state.auth);
  const { upgradeSubscription } = usePayments();

  const handleGetStarted = (plan: string) => {
    if (!user) {
      router.push(`/login?plan=${plan}&interval=${billingCycle}`);
    } else {
      upgradeSubscription(user.userId);
    }
  };

  return (
    <motion.section
      id="pricing"
      className={cn("py-20", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="max-w-6xl mx-auto px-8">
        <div className="flex justify-center mb-8">
          <RadioGroup
            defaultValue="month"
            value={billingCycle}
            onValueChange={value => setBillingCycle(value as "month" | "year")}
            className="grid grid-cols-2 bg-muted p-1 rounded-full w-fit"
          >
            <div>
              <RadioGroupItem
                value="month"
                id="month"
                className="sr-only peer"
              />
              <Label
                htmlFor="month"
                className="px-4 py-1.5 rounded-full text-sm peer-aria-checked:bg-primary peer-aria-checked:text-primary-foreground cursor-pointer"
              >
                Monthly
              </Label>
            </div>
            <div>
              <RadioGroupItem value="year" id="year" className="sr-only peer" />
              <Label
                htmlFor="year"
                className="px-4 py-1.5 rounded-full text-sm peer-aria-checked:bg-primary peer-aria-checked:text-primary-foreground cursor-pointer"
              >
                Annually
              </Label>
            </div>
          </RadioGroup>
        </div>
        <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
            >
              <Card
                className={cn(
                  "ring-1 ring-gray-200 rounded-3xl p-8 xl:p-10 border-none",
                  plan.popular && "ring-2 ring-primary",
                )}
              >
                <CardHeader className="flex flex-col gap-4 p-0">
                  <CardTitle
                    className={cn(
                      "w-full text-xl flex justify-between",
                      plan.popular && "text-primary",
                    )}
                  >
                    <span className=" text-lg/8 font-semibold">
                      {plan.name}
                    </span>
                    {plan.popular && (
                      <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs/5">
                        Most popular
                      </div>
                    )}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {plan.description}
                  </p>
                  <div className="!mt-2">
                    <PriceContainer
                      originalPrice={plan.monthlyPrice}
                      discountPrice={
                        billingCycle === "month"
                          ? undefined
                          : plan.yearlyPlanPrice
                      }
                      isPrimary={plan.popular}
                      annualSavings={
                        billingCycle === "month"
                          ? undefined
                          : plan.annualSavings
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 p-0">
                  <Button
                    className={cn(
                      "mt-8 w-full",
                      plan.popular
                        ? "bg-primary hover:bg-primary/90"
                        : "bg-background hover:bg-accent",
                    )}
                    variant={plan.popular ? "default" : "outline-primary"}
                    onClick={() => handleGetStarted(plan.name.toLowerCase())}
                  >
                    Start free trial
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
