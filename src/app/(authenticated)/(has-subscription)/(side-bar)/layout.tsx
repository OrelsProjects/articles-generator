import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

import { Suspense } from "react";

export default function SideBarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("%c🔥 layout rendered", "color: red; font-size: 20px");

  return (
    <ThemeProvider>
      <Suspense fallback={<LoadingOverlay />}>{children}</Suspense>
    </ThemeProvider>
  );
}
