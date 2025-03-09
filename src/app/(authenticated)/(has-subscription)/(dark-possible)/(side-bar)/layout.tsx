"use client";

import AuthProvider from "@/app/providers/AuthProvider";
import FreeSubscriptionProvider from "@/app/providers/FreeSubscriptionProvider";
import InitiatePlanFromLandingProvider from "@/app/providers/InitiatePlanFromLandingProvider";
import NewSubscriptionProvider from "@/app/providers/NewSubscriptionProvider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

import { Suspense } from "react";

export default function SideBarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppSidebar>
      <Suspense fallback={<LoadingOverlay />}>{children}</Suspense>
    </AppSidebar>
  );
}
