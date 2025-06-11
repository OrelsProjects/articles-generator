import { FeatureFlag } from "@prisma/client";
  import {
    KanbanSquare,
    PenTool,
    Settings,
    Lightbulb,
    Calendar,
    BarChart,
    Radar,
    Bot,
    User,
    FileChartColumnIncreasing,
  } from "lucide-react";

export const rootPath = "/queue";

export const navItems: {
  name: string;
  mobileName: string;
  href: string;
  toolTip?: string;
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
    // toolTip: "Inspiration - under construction",
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
    name: "WriteStack AI",
    mobileName: "AI",
    href: "/writestack-ai",
    icon: Bot,
    locationInMobile: "sidebar",
    featureFlagsRequired: ["chat"],
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
    name: "Notes Stats",
    mobileName: "Notes Stats",
    href: "/notes-stats",
    icon: FileChartColumnIncreasing,
    locationInMobile: "sidebar",
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
];
