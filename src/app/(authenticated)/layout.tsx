"use client";

import AuthProvider from "@/app/providers/AuthProvider";
import { FeedbackProvider } from "@/app/providers/FeedbackProvider";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <AuthProvider>
        <FeedbackProvider />
        {children}
      </AuthProvider>
  );
}
