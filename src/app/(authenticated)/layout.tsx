"use client";

import AuthProvider from "@/app/providers/AuthProvider";
import { FeedbackProvider } from "@/app/providers/FeedbackProvider";

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
