"use client";

import { DataFetchProvider } from "@/app/providers/DataFetchProvider";
import DialogProvider from "@/app/providers/DialogProvider";
import { ExtensionProvider } from "@/app/providers/ExtensionProvider";
import FreeSubscriptionProvider from "@/app/providers/FreeSubscriptionProvider";
import NewSubscriptionDialog from "@/app/providers/NewSubscriptionDialog";
import RequeueProvider from "@/app/providers/RequeueProvider";
import ShowNoteFromUrlProvider from "@/app/providers/ShowNoteFromUrlProvider";
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
            <ShowNoteFromUrlProvider />
            <SubstackCookiesProvider>
              <ExtensionProvider />
              <DialogProvider />
              <RequeueProvider/>
              {children}
            </SubstackCookiesProvider>
          </DataFetchProvider>
        </VisitProvider>
      </SubscriptionProvider>
    </FreeSubscriptionProvider>
  );
}
