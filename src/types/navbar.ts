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
  StickyNote,
} from "lucide-react";

export const rootPath = "/notes";

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
  position: number;
}[] = [
  {
    name: "Inspiration",
    mobileName: "Inspiration",
    // toolTip: "Inspiration - under construction",
    href: "/home",
    icon: Lightbulb,
    locationInMobile: "bottom",
    disabled: false,
    position: 1,
  },
  // {
  //   name: "Queue",
  //   mobileName: "Queue",
  //   href: "/queue",
  //   icon: Calendar,
  //   adminOnly: false,
  //   locationInMobile: "bottom",
  //   position: 2,
  // },
  {
    name: "My notes",
    mobileName: "Notes",
    href: "/notes",
    icon: StickyNote,
    locationInMobile: "bottom",
    position: 3,
  },
  {
    name: "WriteStack AI",
    mobileName: "AI",
    href: "/writestack-ai",
    icon: Bot,
    locationInMobile: "sidebar",
    featureFlagsRequired: ["chat"],
    position: 4,
  },
  {
    name: "Editor",
    mobileName: "Editor",
    href: "/editor",
    // newTab: true,
    icon: PenTool,
    locationInMobile: "sidebar",
    position: 99,
  },
  {
    name: "Statistics",
    mobileName: "Stats",
    href: "/statistics",
    icon: BarChart,
    locationInMobile: "sidebar",
    // adminOnly: true,
    position: 6,
  },
  {
    name: "Notes Stats",
    mobileName: "Notes Stats",
    href: "/notes-stats",
    icon: FileChartColumnIncreasing,
    locationInMobile: "sidebar",
    position: 7,
  },
  {
    name: "Radar",
    mobileName: "Radar",
    href: "/radar/potential-users",
    icon: Radar,
    locationInMobile: "sidebar",
    featureFlagsRequired: ["canUseRadar"],
    position: 8,
  },
];
