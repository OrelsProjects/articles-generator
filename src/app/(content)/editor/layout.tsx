import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editor",
  description: "Editor",
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider forcedTheme="light">{children}</ThemeProvider>;
}
