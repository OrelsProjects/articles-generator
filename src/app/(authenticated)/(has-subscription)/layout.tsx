"use client";

import FreeSubscriptionProvider from "@/app/providers/FreeSubscriptionProvider";
import NewSubscriptionProvider from "@/app/providers/NewSubscriptionProvider";
import SubscriptionProvider from "@/app/providers/SubscriptionProvider";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SubscriptionProvider>
      <NewSubscriptionProvider />
      <FreeSubscriptionProvider>{children}</FreeSubscriptionProvider>
    </SubscriptionProvider>
  );
}
