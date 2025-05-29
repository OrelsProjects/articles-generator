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
import { maxNotesShceduledPerPlan } from "@/lib/plans-consts";
import { Plan } from "@prisma/client";
import PlanComparisonDialog from "./plan-comparison-dialog";
import { Input } from "@/components/ui/input";

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
  "Choose your preferred LLM (Includes GPT-4.5)",
  // "Access to The Best Notes Templates",
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
  const { updateSubscription, goToCheckout, validateCoupon } = usePayments();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [coupon, setCoupon] = useState("");
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscounts, setCouponDiscounts] = useState<any[]>([]);
  const [loadingCoupon, setLoadingCoupon] = useState(false);

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
    [billingCycle, couponDiscounts],
  ).map(plan => {
    const couponDiscount = couponDiscounts.find(
      discount => 
        discount.name.toLowerCase() === plan.name.toLowerCase() &&
        discount.interval === billingCycle,
    );

    if (couponDiscount) {
      const originalPrice =
        billingCycle === "month" ? plan.monthlyPrice : plan.yearlyPlanPrice;
      return {
        ...plan,
        discountedPrice: couponDiscount.newPrice,
        couponDiscount: couponDiscount.discount,
        discountDuration: couponDiscount.discountDuration,
        originalPrice,
      };
    }

    return plan;
  });

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
        await goToCheckout(billingCycle, plan, appliedCoupon || undefined);
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

  const applyCoupon = async () => {
    if (!coupon.trim()) return;

    setLoadingCoupon(true);
    try {
      // Send both monthly and annual plans to get discounts for both
      const allPlans = pricingPlans.flatMap(plan => [
        {
          name: plan.name,
          price: plan.monthlyPrice,
          interval: "month" as const,
        },
        {
          name: plan.name,
          price: plan.yearlyPlanPrice,
          interval: "year" as const,
        },
      ]);

      const discounts = await validateCoupon(coupon, allPlans);
      setCouponDiscounts(discounts);
      setAppliedCoupon(coupon.toUpperCase());
      toast.success("Coupon applied successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Invalid coupon code");
      setCouponDiscounts([]);
      setAppliedCoupon(null);
    } finally {
      setLoadingCoupon(false);
    }
  };

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
        <div className="w-full flex flex-col justify-center items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
            className="flex justify-center mb-4 mt-10"
          >
            <div className="flex flex-col items-center space-y-3">
              {!showCouponInput && !appliedCoupon && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCouponInput(true)}
                  className="text-sm"
                >
                  Apply coupon
                </Button>
              )}

              <motion.div initial={false} className="overflow-hidden mb-3">
                {showCouponInput && (
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="COUPON30"
                      value={coupon}
                      onChange={e => setCoupon(e.target.value)}
                      className="w-48 uppercase"
                      disabled={!!appliedCoupon}
                      onKeyDown={e => e.key === "Enter" && applyCoupon()}
                    />
                    <Button
                      onClick={applyCoupon}
                      disabled={loadingCoupon || !coupon.trim()}
                      size="sm"
                    >
                      {loadingCoupon ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCouponInput(false);
                        setCoupon("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </motion.div>

              {appliedCoupon && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-2"
                >
                  <span className="text-sm text-green-600">
                    Coupon "{appliedCoupon}" applied!
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponDiscounts([]);
                      setCoupon("");
                    }}
                    className="text-xs p-1 h-auto py-0"
                  >
                    Remove
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
          <div
            className={cn(
              "isolate mx-auto grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-6xl lg:grid-cols-3",
              appliedCoupon && "mt-6",
            )}
          >
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
                    "h-full ring-1 ring-gray-200 rounded-3xl p-8 xl:p-10 border-none relative",
                    plan.popular && "ring-2 ring-primary",
                  )}
                >
                  {/* Coupon Discount Badge */}
                  {(plan as any).couponDiscount && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        {(plan as any).couponDiscount}% OFF for{" "}
                        {(plan as any).discountDuration || 1} month
                        {(plan as any).discountDuration > 1 ? "s" : ""}
                      </div>
                    </div>
                  )}

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
                        originalPrice={
                          (plan as any).originalPrice ||
                          (billingCycle === "month"
                            ? plan.monthlyPrice
                            : plan.yearlyPlanPrice)
                        }
                        discountPrice={
                          (plan as any).discountedPrice ||
                          (billingCycle === "month"
                            ? undefined
                            : plan.yearlyPlanPrice)
                        }
                        isPrimary={plan.popular}
                        annualSavings={
                          billingCycle === "month"
                            ? undefined
                            : plan.annualSavings
                        }
                        hasCoupon={!!appliedCoupon}
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
