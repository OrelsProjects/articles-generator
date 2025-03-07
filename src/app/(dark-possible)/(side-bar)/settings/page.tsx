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

export default function SettingsPage() {
  const { setTheme, resolvedTheme } = useTheme();
  const { user } = useAppSelector(selectAuth);
  const { hasPublication } = useSettings();
  const { credits } = useAppSelector(selectSettings);

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully");
  };

  // Calculate credit usage
  const planType = user?.meta?.plan || "free";
  const totalCredits = creditsPerPlan[planType];
  const usedCredits = totalCredits - credits.remaining;
  const creditPercentage = Math.min(
    Math.round((usedCredits / totalCredits) * 100),
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
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {credits.remaining} of {totalCredits} credits remaining
                </span>
                <span className="text-sm text-muted-foreground">
                  {creditPercentage}% used
                </span>
              </div>
              <Progress value={creditPercentage} className="h-2" />

              <div className="mt-4 text-sm text-muted-foreground">
                <p>Credits reset at the beginning of your billing cycle.</p>
                {planType === "free" && (
                  <div className="mt-2">
                    <Button variant="outline" size="sm">
                      Upgrade to get more credits
                    </Button>
                  </div>
                )}
              </div>
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
                  defaultValue={user?.displayName || ""}
                  disabled
                />
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
                  {planType === "free"
                    ? "Free Plan"
                    : planType === "pro"
                      ? "Pro Plan"
                      : "Super Pro Plan"}
                </div>
                {planType === "free" ||
                  (planType === "pro" && (
                    <Button variant="outline" className="mt-2">
                      Upgrade to Premium
                    </Button>
                  ))}
              </div>
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
    </div>
  );
}
