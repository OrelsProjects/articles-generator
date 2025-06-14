"use client";

import { DataFetchProvider } from "@/app/providers/DataFetchProvider";
import DialogProvider from "@/app/providers/DialogProvider";
import { ExtensionProvider } from "@/app/providers/ExtensionProvider";
import FreeSubscriptionProvider from "@/app/providers/FreeSubscriptionProvider";
import NewSubscriptionDialog from "@/app/providers/NewSubscriptionDialog";
import { OnboardingProvider } from "@/app/providers/OnboardingProvider";
import QueueDiscrepancyProvider from "@/app/providers/QueueDiscrepancyProvider";
import ShowNoteFromUrlProvider from "@/app/providers/ShowNoteFromUrlProvider";
import SubscriptionProvider from "@/app/providers/SubscriptionProvider";
import { SubstackCookiesProvider } from "@/app/providers/SubstackCookiesProvider";
import { UpdateDataProvider } from "@/app/providers/UpdateExtensionDataProvider";
import VisitProvider from "@/app/providers/VisitProvider";
import { OnboardingOverlay } from "@/components/onboarding/onboarding-overlay";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FreeSubscriptionProvider>
      <SubscriptionProvider>
        <NewSubscriptionDialog />
        <VisitProvider>
          <DataFetchProvider>
            <ShowNoteFromUrlProvider />
            <SubstackCookiesProvider>
              <ExtensionProvider />
              <DialogProvider />
              <QueueDiscrepancyProvider />
              <UpdateDataProvider />
              <OnboardingProvider>
                {children}
                <OnboardingOverlay />
              </OnboardingProvider>
            </SubstackCookiesProvider>
          </DataFetchProvider>
        </VisitProvider>
      </SubscriptionProvider>
    </FreeSubscriptionProvider>
  );
}
