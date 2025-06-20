"use client";

import { useState } from "react";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "@/lib/features/auth/authSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { Progress } from "@/components/ui/progress";
import { selectSettings } from "@/lib/features/settings/settingsSlice";
import Link from "next/link";
import { StepSliderDialog } from "@/components/ui/step-slider-dialog";
import usePayments from "@/lib/hooks/usePayments";
import { useBilling } from "@/lib/hooks/useBilling";
import { Logger } from "@/logger";

export function CreditsSection() {
  const { purchaseCredits, loadingCredits, cancelSubscription } = usePayments();
  const { user } = useAppSelector(selectAuth);
  const { credits, cancelAt } = useAppSelector(selectSettings);
  const { billingInfo } = useBilling();
  const [showGetTokensDialog, setShowGetTokensDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);

  const creditPercentage = Math.min(
    100 - Math.round((credits.used / Math.max(credits.total, 1)) * 100),
    100,
  );

  const handlePurchaseCredits = async (credits: number) => {
    try {
      await purchaseCredits(credits);
    } catch (error: any) {
      Logger.error("Error purchasing credits:", { error });
      toast.error("Failed to purchase credits. Please try again.");
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setLoadingCancel(true);
      await cancelSubscription();
      toast.success("Your subscription has been canceled");
      setShowCancelDialog(false);
    } catch (error) {
      Logger.error("Error canceling subscription:", { error });
      toast.error("Failed to cancel subscription. Please try again.");
    } finally {
      setLoadingCancel(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Credits</CardTitle>
          <CardDescription>
            Credits are used for AI-powered features like notes generation and
            content enhancement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">
                Credits: {credits.remaining} of {credits.total} remaining
              </span>
              <span className="text-sm text-muted-foreground/80">
                {100 - creditPercentage}% used
              </span>
            </div>
            <Progress value={100 - creditPercentage} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Credits reset every{" "}
              {billingInfo?.interval === "month" ? "month" : "month"} (
              {credits.total})
            </p>
          </div>

          {cancelAt && (
            <div className="mt-2 p-3 border border-border rounded-md bg-muted/30">
              <p className="text-sm text-destructive font-medium">
                Your subscription will be canceled at:{" "}
                {new Date(cancelAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}

          <div className="w-fit mt-4 text-sm text-muted-foreground flex flex-col items-center">
            <div className="mt-2">
              <Button
                variant="neumorphic-primary"
                className="px-5"
                onClick={() => setShowGetTokensDialog(true)}
              >
                Get more credits
              </Button>
            </div>

            <div className="mt-2 w-fit">
              <div className="text-muted-foreground text-center mb-2">Or</div>
              <Button variant="outline" className="w-full" asChild>
                <Link
                  href={"/settings/pricing"}
                  className="text-foreground bg-card"
                >
                  Update plan
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <StepSliderDialog
        open={showGetTokensDialog}
        onOpenChange={setShowGetTokensDialog}
        onContinue={handlePurchaseCredits}
        onCancel={() => {}}
        disabled={loadingCredits}
        loading={loadingCredits}
      />
    </div>
  );
}
