import {
  FileText,
  KanbanSquare,
  PenTool,
  Settings,
  Lightbulb,
  Calendar,
} from "lucide-react";

export const navItems = [
  {
    name: "Inspiration",
    href: "/home",
    icon: Lightbulb,
    locationInMobile: "bottom",
    disabled: false,
  },
  {
    name: "Notes",
    href: "/notes",
    icon: FileText,
    locationInMobile: "bottom",
  },
  {
    name: "My drafts",
    href: "/notes/status-board",
    icon: KanbanSquare,
    locationInMobile: "bottom",
  },
  {
    name: "Notes calendar",
    href: "/calendar",
    icon: Calendar,
    locationInMobile: "bottom",
    adminOnly: true,
  },
  {
    name: "Editor",
    href: "/editor",
    newTab: true,
    icon: PenTool,
    locationInMobile: "sidebar",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    locationInMobile: "sidebar",
  },
  // {
  //   name: "Statistics (coming soon)",
  //   href: "/statistics",
  //   icon: BarChart, // Need chrome extension to get this data. Navigate to user substack and scrape the hell out of it.
  //   disabled: true,
  //   locationInMobile: "sidebar",
  // },
];

export const externalLinks = navItems.filter(item => item.newTab);
