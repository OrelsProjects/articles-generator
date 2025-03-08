import { Home, FileText, KanbanSquare, PenTool, Settings } from "lucide-react";

export const navItems = [
  {
    name: "Home",
    href: "/home",
    icon: Home,
  },
  {
    name: "Notes",
    href: "/notes",
    icon: FileText,
  },
  {
    name: "My drafts",
    href: "/notes/status-board",
    icon: KanbanSquare,
  },
  {
    name: "Editor",
    href: "/editor",
    newTab: true,
    icon: PenTool,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export const externalLinks = navItems.filter(item => item.newTab);