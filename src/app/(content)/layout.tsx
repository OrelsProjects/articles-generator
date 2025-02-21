"use client";

import AuthProvider from "@/app/providers/AuthProvider";
import FreeSubscriptionProvider from "@/app/providers/FreeSubscriptionProvider";
import InitiatePlanFromLandingProvider from "@/app/providers/InitiatePlanFromLandingProvider";
import NewSubscriptionProvider from "@/app/providers/NewSubscriptionProvider";
import { AnalyzePublicationDialog } from "@/components/ui/text-editor/analyze-publication-dialog";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <AppSidebar>
    <AuthProvider>
      <InitiatePlanFromLandingProvider>
        <NewSubscriptionProvider />
        <FreeSubscriptionProvider>
          {children}
        </FreeSubscriptionProvider>
      </InitiatePlanFromLandingProvider>
    </AuthProvider>
    // </AppSidebar>
  );
}
