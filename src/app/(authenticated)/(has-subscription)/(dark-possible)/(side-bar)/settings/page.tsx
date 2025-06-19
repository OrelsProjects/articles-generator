"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "@/lib/features/auth/authSlice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import usePayments from "@/lib/hooks/usePayments";
import { useSettings } from "@/lib/hooks/useSettings";
import { Logger } from "@/logger";
import { Check, Loader2, X, CreditCard, User, Palette, Settings, AlertTriangle, FileText, Bell, Shield, Globe, Users, Code, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";

// Section Components
import { CreditsSection } from "@/components/settings/credits-section";
import { BillingSection } from "@/components/settings/billing-section";
import { AccountSection } from "@/components/settings/account-section";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { PublicationsSection } from "@/components/settings/publications-section";
import { DangerSection } from "@/components/settings/danger-section";

type SettingsSection = 
  | "account" 
  | "billing" 
  | "credits" 
  | "appearance" 
  | "publications" 
  | "danger";

interface SettingsNavItem {
  id: SettingsSection;
  label: string;
  icon: any;
  description: string;
}

interface SettingsCategory {
  category: string;
  items: SettingsNavItem[];
}

const settingsNavItems: SettingsCategory[] = [
  {
    category: "Account",
    items: [
      {
        id: "account" as const,
        label: "Account Information",
        icon: User,
        description: "Manage your personal details and preferences"
      },
      {
        id: "appearance" as const,
        label: "Appearance",
        icon: Palette,
        description: "Customize how the application looks and feels"
      }
    ]
  },
  {
    category: "Subscription",
    items: [
      {
        id: "credits" as const,
        label: "Credits",
        icon: CreditCard,
        description: "Manage your credits and subscription"
      },
      {
        id: "billing" as const,
        label: "Billing & Invoices",
        icon: FileText,
        description: "View your subscription details and billing history"
      }
    ]
  },
  {
    category: "Configuration",
    items: [
      {
        id: "publications" as const,
        label: "Publication Preferences",
        icon: Settings,
        description: "Manage your publication settings and preferences"
      },
      {
        id: "danger" as const,
        label: "Danger Zone",
        icon: AlertTriangle,
        description: "Irreversible and destructive actions"
      }
    ]
  }
];

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useCustomRouter();
  const {
    cancelSubscription,
    applyRetentionDiscount,
  } = usePayments();
  const { user } = useAppSelector(selectAuth);
  const { shouldShow50PercentOffOnCancel } = useSettings();
  
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [loadingDiscount, setLoadingDiscount] = useState(false);
  const [loadingCancelDiscount, setLoadingCancelDiscount] = useState(false);

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
  }, [error, succeeded, router]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.substring(1);
      const allItems: SettingsNavItem[] = settingsNavItems.flatMap(category => category.items);
      const section = allItems.find(item => item.id === id);
      if (section) {
        setActiveSection(section.id);
      }
    }
  }, []);

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

  const renderSection = () => {
    switch (activeSection) {
      case "credits":
        return <CreditsSection />;
      case "billing":
        return <BillingSection />;
      case "account":
        return <AccountSection />;
      case "appearance":
        return <AppearanceSection />;
      case "publications":
        return <PublicationsSection />;
      case "danger":
        return <DangerSection />;
      default:
        return <AccountSection />;
    }
  };

  const getActiveItem = (): SettingsNavItem | undefined => {
    const allItems: SettingsNavItem[] = settingsNavItems.flatMap(category => category.items);
    return allItems.find(item => item.id === activeSection);
  };

  const activeItem = getActiveItem();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex items-start md:items-center justify-center">
      <div className="w-full max-w-6xl mx-auto">
        {/* Main Settings Container */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row min-h-[700px]">
            {/* Sidebar */}
            <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border bg-muted/20">
              {/* Header */}
              <div className="p-6 border-b border-border">
                <h1 className="text-lg font-semibold text-foreground">Settings</h1>
              </div>
              
              {/* Navigation */}
              <div className="p-4">
                {settingsNavItems.map((category) => (
                  <div key={category.category} className="mb-6">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">
                      {category.category}
                    </h3>
                    {/* Mobile: Horizontal scroll, Desktop: Vertical list */}
                    <div className="lg:hidden">
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {category.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeSection === item.id;
                          
                          return (
                            <button
                              key={item.id}
                              onClick={() => setActiveSection(item.id)}
                              className={cn(
                                "flex flex-col items-center gap-2 p-3 rounded-lg whitespace-nowrap transition-all duration-200 min-w-[80px]",
                                isActive 
                                  ? "bg-primary/10 text-primary" 
                                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <Icon className={cn(
                                "h-5 w-5 flex-shrink-0",
                                item.id === "danger" && "text-red-500"
                              )} />
                              <div className={cn(
                                "font-medium text-xs text-center",
                                item.id === "danger" && "text-red-500"
                              )}>
                                {item.label}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Desktop: Vertical list */}
                    <ul className="space-y-1 hidden lg:block">
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => setActiveSection(item.id)}
                              className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 group",
                                isActive 
                                  ? "bg-primary/10 text-primary" 
                                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <Icon className={cn(
                                "h-4 w-4 flex-shrink-0",
                                item.id === "danger" && "text-red-500"
                              )} />
                              <div className="flex-1 min-w-0">
                                <div className={cn(
                                  "font-medium text-sm",
                                  item.id === "danger" && "text-red-500"
                                )}>
                                  {item.label}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {item.description}
                                </div>
                              </div>
                              <ChevronRight className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                isActive && "text-primary",
                                "group-hover:translate-x-0.5"
                              )} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {/* Content Header */}
              {/* <div className="p-6 border-b border-border bg-background">
                <div className="flex items-center gap-3">
                  {activeItem && (
                    <>
                      <activeItem.icon className="h-5 w-5 text-muted-foreground" />
                      <h2 className="text-xl font-semibold text-foreground">
                        {activeItem.label}
                      </h2>
                    </>
                  )}
                </div>
                {activeItem && (
                  <p className="text-muted-foreground text-sm mt-1">
                    {activeItem.description}
                  </p>
                )}
              </div> */}
              
              {/* Content Body */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                {renderSection()}
              </div>
              
              {/* Footer Actions */}
              <div className="border-t border-border p-4 mb-12 md:p-6 bg-muted/20">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
            </div>
          </div>
        </div>
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
                your current plan for the next month (30% for annual plans).
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
    </div>
  );
}
