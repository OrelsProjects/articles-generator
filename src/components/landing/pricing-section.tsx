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

export default function Pricing({ className }: { className?: string }) {
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
              <span>7-Day Free Trial on all pPlans</span>{" "}
            </div>
          </motion.div>
          <motion.p
            className="text-xl text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Startwriting with a 7-day free trial. Cancel anytime.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Pro Monthly */}
          {products.map((product, index) => (
            <motion.div
              key={`${product.id}-monthly`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.2, duration: 0.8 }}
            >
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
                  <CardTitle className="flex items-center justify-between">
                    <span>{product.name}</span>
                    <div className="text-right">
                      <span className="text-3xl font-bold">
                        ${product.priceStructure.monthly.priceFormatted}
                      </span>
                      <div className="text-sm text-muted-foreground">
                        per month
                      </div>
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
            </motion.div>
          ))}

          {/* Pro Yearly */}
          {products.map((product, index) => (
            <motion.div
              key={`${product.id}-yearly`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.2, duration: 0.8 }}
            >
              <BackgroundGradient>
                <Card
                  className={cn(
                    "relative flex flex-col h-full border-0 overflow-hidden",
                    userPlan === "year" && "border-2 border-primary",
                  )}
                >
                  <div className="absolute top-0 left-0 w-full bg-primary/20 text-center py-1 text-sm font-medium">
                    Billed Annually • Save 36%
                  </div>
                  <CardHeader className="pt-8">
                    {userPlan === "year" && (
                      <div className="absolute -top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                        Current Plan
                      </div>
                    )}
                    <CardTitle className="flex items-center justify-between">
                      <span>{product.name}</span>
                      <div className="text-right">
                        <span className="text-3xl font-bold">
                          ${product.priceStructure.yearly.priceFormatted}
                        </span>
                        <div className="text-sm text-muted-foreground">
                          per year
                        </div>
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
                        <Plus className="mr-2" size={16} />
                        <span>Extra 15 AI-powered ideas/day</span>
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
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
