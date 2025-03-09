"use client";

import AuthProvider from "@/app/providers/AuthProvider";
import FreeSubscriptionProvider from "@/app/providers/FreeSubscriptionProvider";
import InitiatePlanFromLandingProvider from "@/app/providers/InitiatePlanFromLandingProvider";
import NewSubscriptionProvider from "@/app/providers/NewSubscriptionProvider";
import SubscriptionProvider from "@/app/providers/SubscriptionProvider";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <InitiatePlanFromLandingProvider>
        {children}
      </InitiatePlanFromLandingProvider>
    </AuthProvider>
  );
}
