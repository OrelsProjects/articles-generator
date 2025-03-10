"use client";

import FreeSubscriptionProvider from "@/app/providers/FreeSubscriptionProvider";
import NewSubscriptionDialog from "@/app/providers/NewSubscriptionDialog";
import SubscriptionProvider from "@/app/providers/SubscriptionProvider";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FreeSubscriptionProvider>
      <SubscriptionProvider>
        <NewSubscriptionDialog />
        {children}
      </SubscriptionProvider>
    </FreeSubscriptionProvider>
  );
}
