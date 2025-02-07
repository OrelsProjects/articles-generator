"use client";

import type * as React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/(content)/editor/sidebar";
import AuthProvider from "@/app/providers/AuthProvider";
import AnimationProvider from "@/app/providers/AnimationProvider";

interface LayoutProps {
  children: React.ReactNode;
}

export function ContentLayout({ children }: LayoutProps) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="flex-1">
            <AnimationProvider>{children}</AnimationProvider>
          </main>
        </div>
      </SidebarProvider>
    </AuthProvider>
  );
}
