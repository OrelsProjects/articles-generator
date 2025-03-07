import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notes Status Board",
  description: "Manage your notes with a kanban-style board",
};

export default function StatusBoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 