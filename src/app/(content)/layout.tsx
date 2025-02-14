"use client";

import { AppSidebar } from "@/app/(content)/editor/sidebar";
import AuthProvider from "@/app/providers/AuthProvider";
import FreeSubscriptionProvider from "@/app/providers/FreeSubscriptionProvider";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <AuthProvider>
        <FreeSubscriptionProvider>{children}</FreeSubscriptionProvider>
      </AuthProvider>
    </SidebarProvider>
  );
}
