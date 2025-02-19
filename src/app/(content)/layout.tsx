"use client";

import AuthProvider from "@/app/providers/AuthProvider";
import FreeSubscriptionProvider from "@/app/providers/FreeSubscriptionProvider";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <AppSidebar>
      <AuthProvider>
        <FreeSubscriptionProvider>{children}</FreeSubscriptionProvider>
      </AuthProvider>
    // </AppSidebar>
  );
}
