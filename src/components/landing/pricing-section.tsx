"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { useMemo, useState } from "react";
import { useEffect } from "react";
import { Product } from "@/types/payment";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { useAppSelector } from "@/lib/hooks/redux";
import { cn } from "@/lib/utils";
import usePayments from "@/lib/hooks/usePayments";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Pricing({ className }: { className?: string }) {
  const [billingCycle, setBillingCycle] = useState<"month" | "year">("year");
  const router = useCustomRouter();
  const { user } = useAppSelector(state => state.auth);
  const { upgradeSubscription } = usePayments();
  const [products, setProducts] = useState<Product[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [didFetchProducts, setDidFetchProducts] = useState(false);

  useEffect(() => {
    if (didFetchProducts) return;
    if (products.length > 0 || fetchingProducts) return;
    setFetchingProducts(true);
    fetch("/api/stripe/products")
      .then(res => res.json())
      .then(data => setProducts(data.products || []))
      .catch(err => {
        console.log(err);
        setProducts([]);
      })
      .finally(() => {
        setFetchingProducts(false);
        setDidFetchProducts(true);
      });
  }, [fetchingProducts, products, didFetchProducts]);

  const userPlan = useMemo(() => {
    if (!user) return null;
    let plan = user.meta?.plan || "free";
    if (plan === "free") return "free";
    if (plan === "pro") return "month";
    if (plan === "superPro") return "year";
    return "free";
  }, [user]);

  const getPlanButton = (
    plan: "month" | "year",
    defaultButton: JSX.Element,
  ) => {
    if (userPlan === plan) {
      return (
        <Button
          className="w-full cursor-not-allowed opacity-70"
          variant="outline"
          disabled
        >
          Current Plan
        </Button>
      );
    }
    return defaultButton;
  };

  const handleGetStarted = (productId: string, priceId: string) => {
    if (!user) {
      router.push(`/login?pri_id=${priceId}&pro_id=${productId}`);
    } else {
      if (userPlan === "month") {
        upgradeSubscription(user.userId);
      }
    }
  };

  const yearlyPricePerMonth = useMemo(() => {
    if (products.length === 0) return null;
    const price =
      parseInt(products[0].priceStructure.yearly.priceFormatted) / 12;
    return price;
    // If price is a round number, return the price minus 1 cent
    // if (price === Math.round(price)) {
    //   return (price - 0.01).toFixed(2);
    // }
    // return price.toFixed(2);
  }, [products]);

  return (
    <motion.section
      id="pricing"
      className={cn("py-20", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div
            className="flex items-center justify-center gap-2 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
          >
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full font-medium flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>7-Day Free Trial on all plans</span>
            </div>
          </motion.div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
              Grow your Substack audience and income
            </h2>
            <p className="text-muted-foreground text-xl font-normal">
              Perfect for writers with 20+ newsletters earning $1k+/month
            </p>
          </div>
        </div>

        {/* Billing cycle toggle */}
        <div
          className={cn("flex flex-col items-center mb-4", {
            hidden: products.length === 0,
          })}
        >
          <div className="relative p-1 rounded-full shadow-sm bg-background/70">
            <RadioGroup
              value={billingCycle}
              onValueChange={value =>
                setBillingCycle(value as "month" | "year")
              }
              className="flex items-center relative z-10"
            >
              <div className="flex items-center">
                <RadioGroupItem value="month" id="month" className="sr-only" />
                <Label
                  htmlFor="month"
                  className={cn(
                    "cursor-pointer px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                    billingCycle === "month"
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Monthly
                </Label>
              </div>
              <div className="flex items-center">
                <RadioGroupItem value="year" id="year" className="sr-only" />
                <Label
                  htmlFor="year"
                  className={cn(
                    "cursor-pointer px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                    billingCycle === "year"
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Yearly
                </Label>
              </div>
            </RadioGroup>

            {/* Active background that moves based on selection */}
            <div
              className={cn(
                "absolute top-1 bottom-1 rounded-full bg-primary transition-all duration-300 ease-in-out",
                billingCycle === "month"
                  ? "left-1 right-[50%]"
                  : "left-[50%] right-1",
              )}
            />
          </div>
        </div>

        <div className="max-w-md mx-auto">
          {products.map(product => (
            <motion.div
              key={`${product.id}-${billingCycle}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1 }}
              className="w-full"
            >
              {billingCycle === "month" ? (
                <Card
                  className={cn(
                    "hover:shadow-lg transition-shadow duration-300 relative flex flex-col h-full overflow-hidden",
                    userPlan === "month" && "border-2 border-primary",
                  )}
                >
                  <div className="absolute top-0 left-0 w-full bg-primary/20 text-center py-1 text-sm font-medium">
                    Billed monthly
                  </div>
                  <CardHeader className="pt-8">
                    {userPlan === "month" && (
                      <div className="absolute -top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                        Current Plan
                      </div>
                    )}
                    <CardTitle className="flex flex-col items-start justify-between mt-4">
                      <span className="text-xl md:text-2xl mb-6">
                        {product.name}
                      </span>
                      <div className="text-right">
                        <p className="flex items-center justify-start gap-1">
                          <span className="text-3xl font-bold">
                            ${product.priceStructure.monthly.dollars}
                          </span>
                          <div className="mt-2 text-sm text-muted-foreground">
                            /mo
                          </div>
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-4 mb-8 flex-1">
                      {product.features.map((feature, i) => (
                        <li className="flex items-center" key={i}>
                          <Check className="text-green-500 mr-2" size={16} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {getPlanButton(
                      "month",
                      <TooltipButton
                        tooltipContent={
                          userPlan === "year"
                            ? "Cannot downgrade. Cancel your yearly plan first."
                            : ""
                        }
                        variant="outline"
                        className={cn("w-full", {
                          "opacity-50 cursor-not-allowed hover:bg-transparent":
                            userPlan === "year",
                        })}
                        onClick={() =>
                          handleGetStarted(
                            product.id,
                            product.priceStructure.monthly.id,
                          )
                        }
                      >
                        Start 7-Day Free Trial
                      </TooltipButton>,
                    )}
                  </CardContent>
                </Card>
              ) : (
                <BackgroundGradient>
                  <Card
                    className={cn(
                      "relative flex flex-col h-full border-0 overflow-hidden",
                      userPlan === "year" && "border-2 border-primary",
                    )}
                  >
                    <div className="absolute top-0 left-0 w-full bg-primary/20 text-center py-1 text-sm font-medium">
                      Billed Annually • Save 20%
                    </div>
                    <CardHeader className="pt-8">
                      {userPlan === "year" && (
                        <div className="absolute -top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                          Current Plan
                        </div>
                      )}
                      <CardTitle className="flex flex-col items-start justify-between mt-4">
                        <span className="text-xl md:text-2xl mb-6">
                          {product.name}
                        </span>
                        <div className="text-right">
                          <p className="flex items-center justify-start gap-1">
                            <span className="text-3xl font-bold">
                              ${yearlyPricePerMonth}
                            </span>
                            <div className="mt-2 text-sm text-muted-foreground">
                              /mo
                            </div>
                          </p>
                          {/* <p className="text-xs text-muted-foreground">
                            ${yearlyPrice} billed annually
                          </p> */}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <ul className="space-y-4 mb-8 flex-1">
                        {product.features.map((feature, i) => (
                          <li className="flex items-center" key={i}>
                            <Check className="text-green-500 mr-2" size={16} />
                            <span>{feature}</span>
                          </li>
                        ))}
                        <li className="flex items-center text-primary">
                          <div className="flex items-center justify-start col gap-0">
                            <p className="flex items-center">
                              <Plus className="mr-2" size={16} />
                              <span>Chrome extension</span>
                            </p>
                            <p className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-md ml-2">
                              coming soon
                            </p>
                          </div>
                        </li>
                        <li className="flex items-center text-primary">
                          <Plus className="mr-2" size={16} />
                          <span>Price locked forever</span>
                        </li>
                      </ul>
                      {getPlanButton(
                        "year",
                        <Button
                          onClick={() =>
                            handleGetStarted(
                              product.id,
                              product.priceStructure.yearly.id,
                            )
                          }
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          Start 7-Day Free Trial
                        </Button>,
                      )}
                    </CardContent>
                  </Card>
                </BackgroundGradient>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
