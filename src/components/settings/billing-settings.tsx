"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, Crown, Star, ExternalLink } from "lucide-react";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "@/lib/features/auth/authSlice";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function BillingSettings() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  const planName = useMemo(() => {
    if (user?.meta?.plan === "pro") return "Write+";
    if (user?.meta?.plan === "superPro") return "Write+ (annual)";
    return "Write+ Free";
  }, [user?.meta?.plan]);

  const canUpgrade = useMemo(() => {
    return user?.meta?.plan !== "superPro";
  }, [user?.meta?.plan]);

  const hasSubscribed = useMemo(() => {
    return user?.meta?.plan !== "free";
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
                {isLoading ? <Skeleton className="w-20 h-4" /> : planName}
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
      {canUpgrade &&
        (hasSubscribed ? (
          <Button
            className="w-full"
            size="lg"
            onClick={() =>
              window.open(
                process.env.NEXT_PUBLIC_UPDATE_SUBSCRIPTION_URL,
                "_blank",
              )
            }
          >
            Upgrade Subscription
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button className="w-full" size="lg" asChild>
            <Link href="/pricing">
              Upgrade now
              <Crown className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ))}
    </div>
  );
}
