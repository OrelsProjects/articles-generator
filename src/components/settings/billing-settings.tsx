"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, Check, Crown, Star, X } from "lucide-react";
import { toast } from "react-toastify";
import usePayments from "@/lib/hooks/usePayments";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "@/lib/features/auth/authSlice";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

const UpgradeCard = ({
  plan,
  isLoading,
  handleUpgradeSubscription,
}: {
  plan: string;
  isLoading: boolean;
  handleUpgradeSubscription: () => void;
}) => {
  return (
    <>
      {isLoading ? (
        <Skeleton className="w-full h-full" />
      ) : (
        <>
          {plan === "free" && (
            <>
              <Card className="relative overflow-hidden border-primary/50 shadow-lg">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-sm rounded-bl-lg">
                  Popular
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-primary" />
                    <span>Monthly Pro</span>
                  </CardTitle>
                  <CardDescription>
                    Perfect for professionals and growing teams
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    $19
                    <span className="text-lg text-muted-foreground">
                      /month
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {[
                      "Advanced analytics",
                      "Priority support",
                      "Custom integrations",
                      "Team collaboration",
                    ].map(feature => (
                      <li key={feature} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleUpgradeSubscription}
                    disabled={isLoading}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Upgrade to Pro
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-primary shadow-lg bg-primary text-primary-foreground">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="h-5 w-5" />
                    <span>Yearly Pro</span>
                  </CardTitle>
                  <CardDescription className="text-primary-foreground/90">
                    Save 36% with our best value plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    $199<span className="text-lg opacity-90">/year</span>
                  </div>
                  <ul className="space-y-2">
                    {[
                      "All Pro features included",
                      "Save 36% compared to monthly",
                      "Lock in current pricing",
                      "Priority support",
                      "Extended feature set",
                    ].map(feature => (
                      <li key={feature} className="flex items-center space-x-2">
                        <Check className="h-4 w-4" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="secondary"
                    className="w-full"
                    size="lg"
                    onClick={handleUpgradeSubscription}
                    disabled={isLoading}
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Get Best Value
                  </Button>
                </CardFooter>
              </Card>
            </>
          )}
          {plan === "pro" && (
            <Card className="md:col-span-2 border-2 border-primary shadow-lg">
              <CardHeader className="space-y-1 bg-primary/5">
                <div className="flex items-center space-x-2">
                  <Crown className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl">
                    Upgrade to Yearly Pro
                  </CardTitle>
                </div>
                <CardDescription className="text-base">
                  Switch to yearly billing and save 36%
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6 p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-2xl font-bold">
                      $199
                      <span className="text-lg text-muted-foreground">
                        /year
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Instead of $228 with monthly billing
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {[
                      "All Pro features included",
                      "Save 36% compared to monthly",
                      "Lock in current pricing",
                      "Priority support",
                    ].map(feature => (
                      <li key={feature} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col justify-center space-y-4">
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="font-medium text-lg">Yearly Savings</p>
                    <p className="text-3xl font-bold text-primary">$29</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      That&apos;s like getting 4.3 months free!
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleUpgradeSubscription}
                    disabled={isLoading}
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade & Save 36%
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  );
};

export function BillingSettings() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { cancelSubscription, upgradeSubscription } = usePayments();
  const { user } = useAppSelector(selectAuth);
  const [subscription, setSubscription] = useState<{
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    status: string;
  } | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (isLoading) return;
      try {
        setIsLoading(true);
        const response = await axios.get("/api/stripe/subscription");
        setSubscription(response.data);
      } catch (error) {
        console.error("Failed to fetch subscription details", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.userId) {
      fetchSubscription();
    }
  }, [user?.userId]);

  async function handleCancelSubscription() {
    if (!user?.userId) return;

    setIsLoading(true);
    try {
      await cancelSubscription(user.userId);
      toast.success("Your subscription has been cancelled.");
    } catch (error) {
      toast.error("Failed to cancel subscription. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpgradeSubscription() {
    if (!user?.userId) return;

    setIsLoading(true);
    try {
      await upgradeSubscription(user.userId);
      toast.success("Your subscription has been upgraded to yearly.");
    } catch (error) {
      toast.error("Failed to upgrade subscription. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const planName = useMemo(() => {
    if (user?.meta?.plan === "pro") return "Write+";
    if (user?.meta?.plan === "superPro") return "Write+ (annual)";
    return "Write+ Free";
  }, [user?.meta?.plan]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h3 className="text-2xl font-bold">Billing Settings</h3>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and unlock premium features
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan Card */}
        <Card className="md:col-span-2 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center space-x-2">
              {user?.meta?.plan === "pro" ? (
                <Star className="h-6 w-6 text-primary" />
              ) : user?.meta?.plan === "superPro" ? (
                <Crown className="h-6 w-6 text-primary" />
              ) : (
                <Sparkles className="h-6 w-6 text-primary" />
              )}
              <CardTitle className="text-xl inline-flex items-center gap-2">
                Current Plan:{" "}
                {isLoading ? (
                  <Skeleton className="w-20 h-4" />
                ) : (
                  planName
                )}
              </CardTitle>
            </div>
            <CardDescription className="text-base mt-2">
              {isLoading ? (
                <Skeleton className="w-40 h-4" />
              ) : subscription?.cancelAtPeriodEnd ? (
                <div className="text-yellow-600">
                  Your subscription will end on{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </div>
              ) : (
                <div>
                  Next billing date:{" "}
                  {subscription?.currentPeriodEnd
                    ? new Date(
                        subscription.currentPeriodEnd,
                      ).toLocaleDateString()
                    : "N/A"}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-background/80 rounded-lg">
              <div className="space-y-1">
                <p className="font-medium">Subscription Status</p>
                {isLoading ? (
                  <Skeleton className="w-40 h-4" />
                ) : (
                  <p className="text-muted-foreground">
                    {subscription?.cancelAtPeriodEnd ? (
                      <span className="text-yellow-600">
                        Cancels at end of period
                      </span>
                    ) : subscription?.status === "active" ? (
                      <span className="text-primary font-medium">Active</span>
                    ) : (
                      "Free Plan"
                    )}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <UpgradeCard
        plan={user?.meta?.plan || "free"}
        isLoading={isLoading}
        handleUpgradeSubscription={handleUpgradeSubscription}
      />

      {/* Modified Cancel Subscription Dialog */}
      {!isLoading &&
        user?.meta?.plan !== "free" &&
        !subscription?.cancelAtPeriodEnd && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-sm text-muted-foreground hover:text-destructive"
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-1 opacity-50" />
                Cancel subscription
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your subscription will remain active until{" "}
                  {subscription?.currentPeriodEnd
                    ? new Date(
                        subscription.currentPeriodEnd,
                      ).toLocaleDateString()
                    : "the end of your billing period"}
                  . You&apos;ll continue to have access to all features until
                  then.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep my subscription</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={handleCancelSubscription}
                >
                  Cancel subscription
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
    </div>
  );
}
