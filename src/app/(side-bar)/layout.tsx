"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import AuthProvider from "@/app/providers/AuthProvider";
import FreeSubscriptionProvider from "@/app/providers/FreeSubscriptionProvider";
import InitiatePlanFromLandingProvider from "@/app/providers/InitiatePlanFromLandingProvider";
import NewSubscriptionProvider from "@/app/providers/NewSubscriptionProvider";

export default function SideBarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <InitiatePlanFromLandingProvider>
        <NewSubscriptionProvider />
        <FreeSubscriptionProvider>
          <AppSidebar>{children}</AppSidebar>
        </FreeSubscriptionProvider>
      </InitiatePlanFromLandingProvider>
    </AuthProvider>
  );
} 