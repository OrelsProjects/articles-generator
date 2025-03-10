"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

import { Suspense } from "react";

export default function SideBarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppSidebar>
      <Suspense fallback={<LoadingOverlay />}>{children}</Suspense>
    </AppSidebar>
  );
}
