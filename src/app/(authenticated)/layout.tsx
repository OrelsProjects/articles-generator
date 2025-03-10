"use client";

import AuthProvider from "@/app/providers/AuthProvider";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
