"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { useAppSelector } from "@/lib/hooks/redux";
import { cn } from "@/lib/utils";
import usePayments from "@/lib/hooks/usePayments";
import PriceContainer from "@/components/ui/price-container";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import {
  maxNotesShceduledPerPlan,
} from "@/lib/plans-consts";
import { Plan } from "@prisma/client";
import PlanComparisonDialog from "./plan-comparison-dialog";

const basicFeatures = (credits: number, interval: "month" | "year") => [
  `${interval === "month" ? credits : credits * 12} WriteStack AI Credits/${interval}`,
  "Easy one-click posting",
  "Specialized AI-Powered Substack editor",
  "Growing Notes Inspirations",
];

const hobbyistFeatures = [
  `Notes scheduling, up to ${maxNotesShceduledPerPlan.hobbyist} at a time (Requires Chrome Extension)`,
  `One-click note posting <span class='text-primary'>(Requires Chrome Extension)</span>`,
];

const advancedFeatures = [
  "Choose your LLM (Includes GPT-4.5)",
  "Access to The Best Notes Templates",
  "Notes scheduling, <span class='text-primary'>unlimited (Requires Chrome)</span>  ",
];

const premiumFeatures = [
  "<span class='text-primary'>Advanced Notes Research Tools</span>",
  "<span class='text-primary'>Can ask for a feature that will be implemented</span>",
  "<span class='text-primary'>Same price forever</span>",
];

export default function Pricing({
  className,
  onboarding,
}: {
  className?: string;
  onboarding?: boolean;
}) {
  const [billingCycle, setBillingCycle] = useState<"month" | "year">("year");
  const router = useCustomRouter();
  const { user } = useAppSelector(state => state.auth);
  const { updateSubscription, goToCheckout } = usePayments();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const pricingPlans = useMemo(
    () => [
      {
        name: "Hobbyist",
        description:
          "The essentials to start building your Substack business today.",
        monthlyPrice: 12.99,
        yearlyPlanPrice: 9.99,
        features: [...basicFeatures(50, billingCycle), ...hobbyistFeatures],
        annualSavings: 35.98,
        popular: false,
      },
      {
        name: "Standard",
        description:
          "Scale your Substack presence and business.<br/>Ideal for accounts looking to grow.",
        monthlyPrice: 29.99,
        yearlyPlanPrice: 23.99,
        features: [...basicFeatures(200, billingCycle), ...advancedFeatures],
        annualSavings: 71.98,
        popular: true,
      },
      {
        name: "Premium",
        description:
          "Supercharge your Substack activity.<br/>Ideal for large, active accounts.",
        monthlyPrice: 49.99,
        yearlyPlanPrice: 39.99,
        features: [
          ...basicFeatures(350, billingCycle),
          ...advancedFeatures,
          ...premiumFeatures,
        ],
        annualSavings: 119.98,
        popular: false,
      },
    ],
    [billingCycle],
  );

  const handleGetStarted = async (plan: string) => {
    // If user is not authenticated or onboarding, proceed without showing dialog
    if (onboarding || !user) {
      processPlanChange(plan);
      return;
    }

    // If user already has a plan, show comparison dialog
    if (user?.meta?.plan) {
      setSelectedPlan(plan as Plan);
      setDialogOpen(true);
    } else {
      // New user getting their first plan
      processPlanChange(plan);
    }
  };

  const processPlanChange = async (plan: string) => {
    setLoading(true);
    try {
      if (onboarding) {
        await goToCheckout(billingCycle, plan);
      } else {
        if (!user) {
          router.push(`/login?plan=${plan}&interval=${billingCycle}`);
        } else {
          await updateSubscription(plan, billingCycle);
          toast.success("Subscription updated successfully!");
        }
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmPlanChange = async () => {
    if (selectedPlan) {
      await processPlanChange(selectedPlan);
      setDialogOpen(false);
      setSelectedPlan(null);
    }
  };

  const hadSubscription = user?.meta?.hadSubscription;

  return (
    <motion.section
      id="pricing"
      className={cn(
        "landing-section-container !w-full h-full relative z-20",
        className,
      )}
    >
      <div className="max-w-6xl mx-auto px-8 relative z-50">
        {onboarding && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex justify-center mb-16"
          >
            <h3 className="text-center text-4xl sm:text-5xl font-semibold">
              One more step before you can start
              <br />
              growing your Substack
            </h3>
          </motion.div>
        )}
        <div className="py-0 !w-full flex flex-col items-center mb-8 md:mb-16">
          <h2>
            {hadSubscription ? (
              <span>
                Choose the plan that{" "}
                <span className="text-primary">fits you!</span>
              </span>
            ) : (
              <span>
                Start your{" "}
                <span className="text-primary">7-day free trial</span> now!
              </span>
            )}
          </h2>
          <p className="mt-4">
            {hadSubscription ? (
              "There's a plan for everyone!"
            ) : (
              <span>
                Don&apos;t worry,{" "}
                <strong>I&apos;ll personally remind you</strong> before your
                trial ends.
              </span>
            )}
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: onboarding ? 0.5 : 0,
            duration: 0.8,
            ease: "easeOut",
          }}
          className="flex justify-center mb-8"
        >
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
        </motion.div>
        <div className="w-full flex justify-center">
          <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-6xl lg:grid-cols-3">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.1 + (onboarding ? 0.6 : 0.1),
                  duration: 0.8,
                }}
                className="h-full"
              >
                <Card
                  className={cn(
                    "h-full ring-1 ring-gray-200 rounded-3xl p-8 xl:p-10 border-none",
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
                    <p
                      className="text-xs text-muted-foreground"
                      dangerouslySetInnerHTML={{
                        __html: plan.description,
                      }}
                    />
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
                      disabled={
                        loading ||
                        (user?.meta?.plan === plan.name.toLowerCase() &&
                          user?.meta?.interval === billingCycle)
                      }
                      onClick={() => handleGetStarted(plan.name.toLowerCase())}
                    >
                      {loading && (
                        <RefreshCw className="mr-2 w-4 h-4 animate-spin" />
                      )}
                      {hadSubscription
                        ? user?.meta?.plan === plan.name.toLowerCase() &&
                          user?.meta?.interval === billingCycle
                          ? "Your plan"
                          : "Update plan"
                        : "Start free trial"}
                    </Button>
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span
                            className="text-sm"
                            dangerouslySetInnerHTML={{
                              __html: feature,
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Plan comparison dialog */}
      {selectedPlan && user?.meta?.plan && (
        <PlanComparisonDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          currentPlan={user?.meta?.plan || null}
          targetPlan={selectedPlan as Plan}
          onConfirm={confirmPlanChange}
          loading={loading}
        />
      )}

      {/* {onboarding && (
        <div className="absolute inset-0 z-10" id="onboarding-background">
          <Image
            src="/home-dark.png"
            alt="Home"
            fill
            className="absolute inset-0 object-contain hidden dark:block z-10"
          />
          <Image
            src="/home-light.png"
            alt="Home"
            fill
            className="absolute inset-0 object-contain block dark:hidden z-10"
          />
          <div className="absolute inset-0 bg-foreground/50 dark:bg-background/70 backdrop-blur-sm z-20" />
        </div>
      )} */}
    </motion.section>
  );
}
