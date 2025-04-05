"use client";

import { DataFetchProvider } from "@/app/providers/DataFetchProvider";
import FreeSubscriptionProvider from "@/app/providers/FreeSubscriptionProvider";
import NewSubscriptionDialog from "@/app/providers/NewSubscriptionDialog";
import SubscriptionProvider from "@/app/providers/SubscriptionProvider";
import { SubstackCookiesProvider } from "@/app/providers/SubstackCookiesProvider";
import VisitProvider from "@/app/providers/VisitProvider";

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
            <SubstackCookiesProvider>{children}</SubstackCookiesProvider>
          </DataFetchProvider>
        </VisitProvider>
      </SubscriptionProvider>
    </FreeSubscriptionProvider>
  );
}
