"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "@/lib/features/auth/authSlice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-toastify";

export default function SettingsPage() {
  const { user } = useAppSelector(selectAuth);
  const [activeTab, setActiveTab] = useState("account");
  
  const handleSaveSettings = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <Tabs defaultValue="account" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
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
                  {user?.meta?.plan === "free" ? "Free Plan" : "Premium Plan"}
                </div>
                {user?.meta?.plan === "free" && (
                  <Button variant="outline" className="mt-2">
                    Upgrade to Premium
                  </Button>
                )}
              </div>
              
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
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
                <Switch id="dark-mode" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compact-view">Compact View</Label>
                  <p className="text-sm text-muted-foreground">
                    Show more content with less spacing.
                  </p>
                </div>
                <Switch id="compact-view" />
              </div>
              
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage how you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email.
                  </p>
                </div>
                <Switch id="email-notifications" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications in your browser.
                  </p>
                </div>
                <Switch id="push-notifications" />
              </div>
              
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 