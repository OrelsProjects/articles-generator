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
import { Logger } from "@/logger";
import { Check, Info, Loader2, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams } from "next/navigation";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";

export default function SettingsPage() {
  const { setTheme, resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const router = useCustomRouter();
  const {
    purchaseCredits,
    loadingCredits,
    cancelSubscription,
    applyRetentionDiscount,
  } = usePayments();
  const { user } = useAppSelector(selectAuth);
  const {
    hasPublication,
    shouldShow50PercentOffOnCancel,
    updatePreferredLanguage,
    updateName,
  } = useSettings();
  const { credits, cancelAt } = useAppSelector(selectSettings);
  const { billingInfo, loading: loadingBilling } = useBilling();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showGetTokensDialog, setShowGetTokensDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [loadingDiscount, setLoadingDiscount] = useState(false);
  const [loadingCancelDiscount, setLoadingCancelDiscount] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(
    user?.meta?.preferredLanguage || "en",
  );
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [savingName, setSavingName] = useState(false);
  const [nameChanged, setNameChanged] = useState(false);

  const error = searchParams.get("error");
  const succeeded = searchParams.get("succeeded");

  useEffect(() => {
    if (error) {
      if (succeeded) {
        toast.error(
          "Something went wrong. Please contact support at support@writestack.io",
          {
            autoClose: 10000,
          },
        );
      } else {
        toast.error("Something went wrong. You were not charged", {
          autoClose: 3500,
        });
      }
      router.push("/settings", {
        paramsToRemove: ["error", "succeeded"],
      });
    }
  }, [error, succeeded]);

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

  const handleCancelRequest = async () => {
    try {
      setLoadingCancelDiscount(true);
      // Check if user is eligible for retention discount before cancelling
      const isEligible = await shouldShow50PercentOffOnCancel();
      setLoadingCancelDiscount(false);

      if (isEligible) {
        // Show discount dialog instead of cancelling
        setShowDiscountDialog(true);
      } else {
        // Proceed with cancellation
        await handleCancelSubscription();
      }
    } catch (error) {
      setLoadingCancelDiscount(false);
      Logger.error("Error checking for discount:", { error });
      // Fall back to regular cancellation
      await handleCancelSubscription();
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

  const handleApplyDiscount = async () => {
    try {
      setLoadingDiscount(true);
      const success = await applyRetentionDiscount();
      if (success) {
        toast.success("50% discount applied to your subscription!");
        setShowDiscountDialog(false);
        setShowCancelDialog(false);
      } else {
        toast.error("Failed to apply discount. Please try again.");
      }
    } catch (error) {
      Logger.error("Error applying discount:", { error });
      toast.error("Failed to apply discount. Please try again.");
    } finally {
      setLoadingDiscount(false);
    }
  };

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

  const handleLanguageChange = async (value: string) => {
    setSelectedLanguage(value);
    setSavingLanguage(true);
    try {
      const success = await updatePreferredLanguage(value);
      if (success) {
        toast.success("Language preference updated successfully");
      } else {
        toast.error("Failed to update language preference");
      }
    } finally {
      setSavingLanguage(false);
    }
  };

  const handleNameChange = (value: string) => {
    setDisplayName(value);
    setNameChanged(value !== (user?.displayName || ""));
  };

  const handleSaveName = async () => {
    if (!nameChanged || !displayName.trim()) return;

    setSavingName(true);
    try {
      await updateName(displayName.trim());
      toast.success("Name updated successfully");
      setNameChanged(false);
    } catch (error) {
      Logger.error("Error updating name:", { error });
      toast.error("Failed to update name. Please try again.");
    } finally {
      setSavingName(false);
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
                  Credits are used for AI-powered features like notes generation
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
                            (Billed{" "}
                            {billingInfo.interval === "month"
                              ? "monthly"
                              : "yearly"}
                            )
                          </span>
                        )}
                      </div>

                      {billingInfo?.nextBillingDate && (
                        <div>
                          <span className="font-medium">
                            Next Billing Date:
                          </span>{" "}
                          <span>
                            {billingInfo.nextBillingDate.toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      )}

                      {billingInfo?.coupon && (
                        <div className="mt-4 p-3 border border-border rounded-md bg-muted/30">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Applied Coupon:</span>
                            <Badge
                              variant={
                                billingInfo.coupon.isValid
                                  ? "default"
                                  : "outline"
                              }
                              className={
                                billingInfo.coupon.isValid
                                  ? "bg-green-600"
                                  : "text-muted-foreground"
                              }
                            >
                              {billingInfo.coupon.emoji}{" "}
                              {billingInfo.coupon.name}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center">
                            <span>
                              {billingInfo.coupon.percentOff}% discount
                            </span>
                            {/* If it's annual, a tooltip should tel lthe user that it's calculated as portion of the year */}
                            <TooltipProvider delayDuration={20}>
                              <Tooltip>
                                <TooltipTrigger className="pt-1 ml-1">
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="bg-background text-foreground">
                                  <p>
                                    This coupon is calculated as portion of the
                                    year. (
                                    <span className="font-bold">Example:</span>
                                    50% 1 month is ~5% for the whole year)
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          {!billingInfo.coupon.isValid && (
                            <p className="text-sm text-muted-foreground mt-1">
                              This coupon is no longer active on your
                              subscription.
                            </p>
                          )}
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
                  <Input
                    id="name"
                    value={displayName}
                    onChange={e => handleNameChange(e.target.value)}
                    disabled={savingName}
                  />
                  {nameChanged && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveName}
                        disabled={savingName || !displayName.trim()}
                        className="flex items-center gap-2"
                      >
                        {savingName ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Name"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDisplayName(user?.displayName || "");
                          setNameChanged(false);
                        }}
                        disabled={savingName}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={user?.email || ""} disabled />
                  <p className="text-sm text-muted-foreground">
                    Your email address is used for login and cannot be changed.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Preferred Language</Label>
                  <Select
                    value={selectedLanguage}
                    onValueChange={handleLanguageChange}
                    disabled={savingLanguage}
                  >
                    <SelectTrigger id="language" className="w-full">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="it">Italiano</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="ko">한국어</SelectItem>
                    </SelectContent>
                  </Select>
                  {savingLanguage && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving language preference...
                    </p>
                  )}
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>
                      Note: The language preference affects the AI-generated
                      content only, not the application interface.
                    </p>
                  </div>
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
          <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                disabled={loadingCancelDiscount || loadingCancel}
              >
                ← No, keep subscription
              </Button>
              <Button
                variant="destructive"
                disabled={loadingCancelDiscount || loadingCancel}
                onClick={handleCancelRequest}
                className="flex items-center justify-center gap-2"
              >
                {loadingCancelDiscount ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking options...
                  </>
                ) : loadingCancel ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Yes, cancel subscription"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 50% Discount Offer Dialog */}
        <Dialog
          open={showDiscountDialog}
          onOpenChange={open => {
            if (!open) {
              setShowDiscountDialog(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center justify-center text-center">
                <span className="text-2xl">🎁</span> Special Offer Just For You!
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-lg text-center mb-2">
                  50% OFF Your Subscription
                </h3>
                <p className="text-center">
                  We&apos;d hate to see you go! Stay with us and get 50% off
                  your current plan for the next month (20% for annual plans).
                </p>
              </div>

              <div className="space-y-3 mt-4">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Keep your scheduled notes and history</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Continue with all your features</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Pay only half the price</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDiscountDialog(false);
                  handleCancelSubscription();
                }}
                className="flex items-center justify-center gap-2"
                disabled={loadingDiscount}
              >
                <X className="h-4 w-4" />
                Cancel subscription
              </Button>
              <Button
                onClick={handleApplyDiscount}
                disabled={loadingDiscount}
                className="flex items-center justify-center gap-2"
              >
                {loadingDiscount ? (
                  <>Applying discount...</>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Apply 50% discount
                  </>
                )}
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
