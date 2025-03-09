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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-toastify";
import { PublicationPreferences } from "@/components/settings/publication-preferences";
import { useSettings } from "@/lib/hooks/useSettings";
import { creditsPerPlan } from "@/lib/plans-consts";
import { Progress } from "@/components/ui/progress";
import { selectSettings } from "@/lib/features/settings/settingsSlice";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";

export default function SettingsPage() {
  const { setTheme, resolvedTheme } = useTheme();
  const { user } = useAppSelector(selectAuth);
  const { hasPublication } = useSettings();
  const { credits } = useAppSelector(selectSettings);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully");
  };

  const cancelSubscription = async () => {
    try {
      await axios.post("/api/user/subscription/cancel");
      toast.success("Your subscription has been canceled");
      setShowCancelDialog(false);
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast.error("Failed to cancel subscription. Please try again.");
    }
  };

  // Calculate credit usage
  const planType = user?.meta?.plan || "standard";
  const planCredits = creditsPerPlan[
    planType as keyof typeof creditsPerPlan
  ] || { article: 0, regular: 0 };

  const articleCreditsTotal = planCredits.article;
  const regularCreditsTotal = planCredits.regular;

  const articleCreditsUsed =
    articleCreditsTotal - (credits.articleCredits?.remaining || 0);
  const regularCreditsUsed =
    regularCreditsTotal - (credits.regularCredits?.remaining || 0);

  const articleCreditPercentage = Math.min(
    Math.round((articleCreditsUsed / Math.max(articleCreditsTotal, 1)) * 100),
    100,
  );

  const regularCreditPercentage = Math.min(
    Math.round((regularCreditsUsed / Math.max(regularCreditsTotal, 1)) * 100),
    100,
  );

  return (
    <div className="container py-8">
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
              {/* Article Credits */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    Article Credits: {credits.articleCredits?.remaining || 0} of{" "}
                    {articleCreditsTotal} remaining
                  </span>
                  <span className="text-sm text-muted-foreground/80">
                    {100 - articleCreditPercentage}% used
                  </span>
                </div>
                <Progress
                  value={100 - articleCreditPercentage}
                  className="h-2"
                />
              </div>

              {/* Regular Credits */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    Regular Credits: {credits.regularCredits?.remaining || 0} of{" "}
                    {regularCreditsTotal} remaining
                  </span>
                  <span className="text-sm text-muted-foreground/80">
                    {100 - regularCreditPercentage}% used
                  </span>
                </div>
                <Progress
                  value={100 - regularCreditPercentage}
                  className="h-2"
                />
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                <p>Credits reset at the beginning of your billing cycle.</p>
                {planType !== "executive" && (
                  <div className="mt-2">
                    <Button variant="outline" size="sm">
                      Upgrade to get more credits
                    </Button>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" className="mt-2">
                Cancel subscription
              </Button>
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

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="subscription">Subscription Plan</Label>
                <div className="text-sm font-medium">
                  {planType === "standard"
                    ? "Standard Plan"
                    : planType === "premium"
                      ? "Premium Plan"
                      : "Executive Plan"}
                </div>
                {planType === "standard" ? (
                  <Button variant="outline" className="mt-2">
                    Upgrade to Premium
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    Cancel Subscription
                  </Button>
                )}
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
                    Enable dark mode for a more comfortable viewing experience.
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
        {hasPublication && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              Publication Preferences
            </h2>
            <PublicationPreferences />
          </section>
        )}
      </div>

      {/* Cancel Subscription Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Are you sure you want to cancel?
            </DialogTitle>
            <DialogDescription className="pt-4 text-base">
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Here's what you'll lose:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Premium content generation</li>
                    <li>Advanced AI features</li>
                    <li>{planCredits.article} article credits per month</li>
                    <li>{planCredits.regular} regular credits per month</li>
                  </ul>
                </div>

                <p>
                  If you cancel, you'll still have access to premium features
                  until the end of your current billing period.
                </p>

                <div className="text-sm text-muted-foreground border-l-4 border-primary/30 pl-3 py-1">
                  Your subscription will remain active until{" "}
                  <span className="font-medium">
                    {user?.meta?.currentPeriodEnd
                      ? new Date(user.meta.currentPeriodEnd).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )
                      : "the end of your billing period"}
                  </span>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-5">
            <Button
              type="button"
              variant="outline"
              className="sm:w-auto text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => cancelSubscription()}
            >
              Yes, cancel my subscription
            </Button>
            <Button
              type="button"
              className="sm:w-auto font-medium"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep my subscription
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
