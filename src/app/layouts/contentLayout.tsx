"use client";

import type * as React from "react";
import { AppSidebar } from "@/app/(content)/editor/sidebar";
import AuthProvider from "@/app/providers/AuthProvider";
import AnimationProvider from "@/app/providers/AnimationProvider";

interface LayoutProps {
  children: React.ReactNode;
}

export function ContentLayout({ children }: LayoutProps) {
  return (
    <AuthProvider>
      <AppSidebar>
        <div className="flex min-h-screen">
          <main className="flex-1">
            <AnimationProvider>{children}</AnimationProvider>
          </main>
        </div>
      </AppSidebar>
    </AuthProvider>
  );
}
