"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "@/lib/features/auth/authSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-toastify";
import { PublicationPreferences } from "@/components/settings/publication-preferences";
import { useSettings } from "@/lib/hooks/useSettings";
import { Progress } from "@/components/ui/progress";
import { selectSettings } from "@/lib/features/settings/settingsSlice";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { StepSliderDialog } from "@/components/ui/step-slider-dialog";
import usePayments from "@/lib/hooks/usePayments";
import { DangerZone } from "@/components/settings/danger-zone";
import { useBilling } from "@/lib/hooks/useBilling";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { setTheme, resolvedTheme } = useTheme();
  const { purchaseCredits, loadingCredits, cancelSubscription } = usePayments();
  const { user } = useAppSelector(selectAuth);
  const { hasPublication } = useSettings();
  const { credits, cancelAt } = useAppSelector(selectSettings);
  const { billingInfo, loading: loadingBilling } = useBilling();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showGetTokensDialog, setShowGetTokensDialog] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.substring(1);
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 100); // slight delay to ensure it's rendered
      }
    }
  }, []);

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully");
  };

  const handleCancelSubscription = async () => {
    try {
      setLoadingCancel(true);
      await cancelSubscription();
      toast.success("Your subscription has been canceled");
      setShowCancelDialog(false);
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast.error("Failed to cancel subscription. Please try again.");
    } finally {
      setLoadingCancel(false);
    }
  };

  const creditPercentage = Math.min(
    Math.round((credits.used / Math.max(credits.total, 1)) * 100),
    100,
  );

  const handlePurchaseCredits = async (credits: number) => {
    try {
      await purchaseCredits(credits);
    } catch (error) {
      console.error("Error purchasing credits:", error);
      toast.error("Failed to purchase credits. Please try again.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-transparent py-8 pb-28 md:py-16 flex justify-center items-start">
      <div className="w-full container">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="space-y-8">
          {/* Credits Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Credits</h2>
            <Card>
              <CardHeader>
                <CardTitle>Your Credits</CardTitle>
                <CardDescription>
                  Credits are used for AI-powered features like idea generation
                  and content enhancement.
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
                    Credits reset every month ({credits.total})
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
                    <div className="text-muted-foreground text-center mb-2">
                      Or
                    </div>
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
                <div className="w-full flex justify-end">
                  <Button
                    variant="link"
                    className="mt-2 text-muted-foreground hover:text-destructive"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    Cancel subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Billing Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Billing Information</h2>
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
                <CardDescription>
                  Information about your current subscription plan and billing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingBilling ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Current Plan:</span>
                        <Badge variant="outline" className="capitalize">
                          {billingInfo?.plan || "Free"}
                        </Badge>
                        {billingInfo?.interval && (
                          <span className="text-sm text-muted-foreground">
                            (Billed {billingInfo.interval === "month" ? "monthly" : "yearly"})
                          </span>
                        )}
                      </div>
                      
                      {billingInfo?.nextBillingDate && (
                        <div>
                          <span className="font-medium">Next Billing Date:</span>{" "}
                          <span>
                            {billingInfo.nextBillingDate.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                      
                      {billingInfo?.coupon && (
                        <div className="mt-4 p-3 border border-border rounded-md bg-muted/30">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Applied Coupon:</span>
                            <Badge 
                              variant={billingInfo.coupon.isValid ? "default" : "outline"}
                              className={billingInfo.coupon.isValid ? "bg-green-600" : "text-muted-foreground"}
                            >
                              {billingInfo.coupon.emoji} {billingInfo.coupon.name}
                            </Badge>
                          </div>
                          <div className="mt-1">
                            <span>{billingInfo.coupon.percentOff}% discount</span>
                            {!billingInfo.coupon.isValid && (
                              <p className="text-sm text-muted-foreground mt-1">
                                This coupon is no longer active on your subscription.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="w-fit mt-4">
                      <Button variant="outline" className="w-full" asChild>
                        <Link
                          href={"/settings/pricing"}
                          className="text-foreground bg-card"
                        >
                          Update plan
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Account Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Account Information</h2>
            <Card>
              <CardHeader>
                <CardTitle>Personal Details</CardTitle>
                <CardDescription>
                  Manage your account settings and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue={user?.displayName || ""} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={user?.email || ""} disabled />
                  <p className="text-sm text-muted-foreground">
                    Your email address is used for login and cannot be changed.
                  </p>
                </div>
                <Button onClick={handleSaveSettings}>Save Changes</Button>
              </CardContent>
            </Card>
          </section>

          {/* Appearance Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Appearance</h2>
            <Card>
              <CardHeader>
                <CardTitle>Display Settings</CardTitle>
                <CardDescription>
                  Customize how the application looks and feels.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable dark mode for a more comfortable viewing
                      experience.
                    </p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={resolvedTheme === "dark"}
                    onCheckedChange={() =>
                      setTheme(resolvedTheme === "dark" ? "light" : "dark")
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Publication Section - Only shown if user has a publication */}
          <section id="preferences">
            <h2 className="text-2xl font-semibold mb-4">
              Publication Preferences
            </h2>
            {hasPublication && <PublicationPreferences />}
          </section>

          {/* Danger Zone Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-red-500">
              Danger Zone
            </h2>
            <DangerZone />
          </section>
        </div>

        {/* Cancel Subscription Confirmation Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Cancel subscription
              </DialogTitle>
            </DialogHeader>

            <div className="bg-muted/50 border border-border rounded-md p-4 my-4">
              <p className="text-muted-foreground">
                Is there something we can do to change your mind? I&apos;d love
                to hear from you. <br /> Please{" "}
                <Link
                  href="mailto:oreslam@gmail.com"
                  className="text-primary hover:underline"
                >
                  email
                </Link>{" "}
                me 👍
              </p>
            </div>

            <p className="text-foreground text-base">
              Your subscription will remain active until the end of your current
              billing cycle, which is{" "}
              {user?.meta?.currentPeriodEnd
                ? new Date(user.meta.currentPeriodEnd).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )
                : "the end of your current billing period"}
              .
            </p>

            <p className="text-red-500 font-medium mt-6">
              Your account will be locked after this date.
            </p>

            <ul className="list-disc pl-6 mt-4 space-y-3 text-foreground text-sm">
              <li>Scheduled notes will not be sent.</li>
              <li>You will not have access to your notes or posts.</li>
              <li>You will lose any and all access to your account.</li>
              <li>Your subscription will not renew.</li>
            </ul>

            <div className="border-t border-border my-6 pt-4">
              <h3 className="text-lg font-semibold text-foreground text-center">
                Are you sure you want to cancel your subscription?
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-4">
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 border border-primary"
                onClick={() => setShowCancelDialog(false)}
              >
                ← No, keep subscription
              </Button>
              <Button
                variant="destructive"
                disabled={loadingCancel}
                onClick={handleCancelSubscription}
              >
                Yes, cancel subscription
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <div className="w-full flex justify-end mt-2">
          <Button
            variant="link"
            size="sm"
            asChild
            className="text-muted-foreground text-sm"
          >
            <Link href="/tos" target="_blank">
              Terms of Service
            </Link>
          </Button>
        </div>
      </div>
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
