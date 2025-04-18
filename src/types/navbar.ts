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
    mobileName: "Inspiration",
    href: "/home",
    icon: Lightbulb,
    locationInMobile: "bottom",
    disabled: false,
  },
  {
    name: "Queue",
    mobileName: "Queue",
    href: "/queue",
    icon: Calendar,
    adminOnly: false,
    locationInMobile: "bottom",
  },
  {
    name: "My drafts",
    mobileName: "Drafts",
    href: "/status-board",
    icon: KanbanSquare,
    locationInMobile: "bottom",
  },
  {
    name: "Editor",
    mobileName: "Editor",
    href: "/editor",
    newTab: true,
    icon: PenTool,
    locationInMobile: "sidebar",
  },
  {
    name: "Settings",
    mobileName: "Settings",
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
