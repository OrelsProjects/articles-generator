"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Plus, ArrowLeft } from "lucide-react";
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
import Link from "next/link";

export default function PricingPage() {
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
    plan: "free" | "month" | "year",
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
    if (!user || userPlan === "free") {
      router.push(`/editor?pri_id=${priceId}&pro_id=${productId}`);
    } else {
      if (userPlan === "month") {
        upgradeSubscription(user.userId);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="w-full flex items-center gap-4 bg-background px-4 border-b border-border py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/editor">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Pricing</h1>
      </header>

      <motion.section
        id="pricing"
        className="py-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h1
              className="text-5xl font-bold mb-4 text-primary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Pricing Plans
            </motion.h1>
            <motion.p
              className="text-xl text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Choose the perfect plan for your writing needs
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300 relative flex flex-col h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Free</span>
                    <span className="text-2xl font-bold">$0</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center">
                      <Check className="text-green-500 mr-2" size={16} />
                      <span>Basic text editor access</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="text-green-500 mr-2" size={16} />
                      <span>5 AI-powered idea generations/day</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="text-green-500 mr-2" size={16} />
                      <span>3 title & subtitle refinements/day</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="text-green-500 mr-2" size={16} />
                      <span>10 text enhancements/day</span>
                    </li>
                  </ul>
                  {getPlanButton(
                    "free",
                    <Button variant="outline" className="w-full">
                      Get Started Free
                    </Button>,
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Pro Plans */}
            {products.map((product, index) => (
              <motion.div
                key={`${product.id}-monthly`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.2, duration: 0.8 }}
              >
                <Card
                  className={cn(
                    "hover:shadow-lg transition-shadow duration-300 relative flex flex-col h-full",
                    userPlan === "month" && "border-2 border-primary",
                  )}
                >
                  <CardHeader>
                    {userPlan === "month" && (
                      <div className="absolute -top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                        Current Plan
                      </div>
                    )}
                    <CardTitle className="flex items-center justify-between">
                      <span>{product.name} Monthly</span>
                      <span className="text-2xl font-bold">
                        ${product.priceStructure.monthly.priceFormatted}
                      </span>
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
                        {userPlan === "year" ? "Unavailable" : "Get Started"}
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
                className="md:col-span-1"
              >
                <BackgroundGradient>
                  <Card
                    className={cn(
                      "relative flex flex-col h-full border-0",
                      userPlan === "year" && "border-2 border-primary",
                    )}
                  >
                    <CardHeader>
                      {userPlan === "year" && (
                        <div className="absolute -top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                          Current Plan
                        </div>
                      )}
                      <CardTitle className="flex items-center justify-between pt-2">
                        <span>{product.name} Yearly</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold">
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
                        <li className="flex items-center text-primary font-semibold">
                          <Plus className="mr-2" size={16} />
                          <span>Save 36% yearly</span>
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
                        >
                          Get Started
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
    </div>
  );
}
