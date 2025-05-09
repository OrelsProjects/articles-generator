import { FeatureFlag } from "@prisma/client";
import {
  FileText,
  KanbanSquare,
  PenTool,
  Settings,
  Lightbulb,
  Calendar,
  BarChart,
  Radar,
} from "lucide-react";

export const navItems: {
  name: string;
  mobileName: string;
  href: string;
  newTab?: boolean;
  icon: React.ElementType;
  locationInMobile: "bottom" | "sidebar";
  featureFlagsRequired?: FeatureFlag[];
  disabled?: boolean;
  adminOnly?: boolean;
}[] = [
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
    name: "Statistics",
    mobileName: "Stats",
    href: "/statistics",
    icon: BarChart,
    locationInMobile: "sidebar",
    // adminOnly: true,
  },
  {
    name: "Settings",
    mobileName: "Settings",
    href: "/settings",
    icon: Settings,
    locationInMobile: "sidebar",
  },
  {
    name: "Radar",
    mobileName: "Radar",
    href: "/radar/potential-users",
    icon: Radar,
    locationInMobile: "sidebar",
    featureFlagsRequired: ["canUseRadar"],
  },
  // {
  //   name: "Statistics (coming soon)",
  //   href: "/statistics",
  //   icon: BarChart, // Need chrome extension to get this data. Navigate to user substack and scrape the hell out of it.
  //   disabled: true,
  //   locationInMobile: "sidebar",
  // },
];
