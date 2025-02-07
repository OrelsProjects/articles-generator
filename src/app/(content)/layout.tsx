"use client";

import { AppSidebar } from "@/app/(content)/editor/sidebar";
import AuthProvider from "@/app/providers/AuthProvider";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <AuthProvider>{children}</AuthProvider>
    </SidebarProvider>
  );
}
