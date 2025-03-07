"use client";

import { AppSidebar } from "@/app/(content)/editor/sidebar";
import AuthProvider from "@/app/providers/AuthProvider";
import FreeSubscriptionProvider from "@/app/providers/FreeSubscriptionProvider";
import InitiatePlanFromLandingProvider from "@/app/providers/InitiatePlanFromLandingProvider";
import NewSubscriptionProvider from "@/app/providers/NewSubscriptionProvider";
import GenerateNotesSidebar from "@/components/home/generate-notes-sidebar";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppSidebar>
      <AuthProvider>
        <InitiatePlanFromLandingProvider>
          <NewSubscriptionProvider />
          <FreeSubscriptionProvider>{children}</FreeSubscriptionProvider>
          <GenerateNotesSidebar />
        </InitiatePlanFromLandingProvider>
      </AuthProvider>
    </AppSidebar>
  );
}
