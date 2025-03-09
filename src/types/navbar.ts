import {
  Home,
  FileText,
  KanbanSquare,
  PenTool,
  Settings,
  BarChart,
  Calendar,
} from "lucide-react";

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
  {
    name: "Statistics (coming soon)",
    href: "/statistics",
    icon: BarChart, // Need chrome extension to get this data. Navigate to user substack and scrape the hell out of it.
    disabled: true,
  },
  {
    name: "Schedule (coming soon)",
    href: "/schedule",
    icon: Calendar,
    disabled: true,
  },
];

export const externalLinks = navItems.filter(item => item.newTab);
