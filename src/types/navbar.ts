import { FeatureFlag } from "@prisma/client";
import {
  PenTool,
  Lightbulb,
  BarChart,
  Radar,
  Bot,
  FileChartColumnIncreasing,
  StickyNote,
  BarChart3,
  Users,
} from "lucide-react";

export const rootPath = "/notes";

export const categoryIcons = {
  "Notes Statistics": BarChart3,
};

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
  category?: string;
}[] = [
  {
    name: "Inspiration",
    mobileName: "Inspiration",
    href: "/home",
    icon: Lightbulb,
    locationInMobile: "bottom",
    disabled: false,
    position: 1,
  },
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
    name: "Collaboration",
    mobileName: "Collaboration",
    href: "/collaboration",
    icon: Users,
    locationInMobile: "sidebar",
    featureFlagsRequired: ["ghostwriter"],
    position: 5,
  },
  {
    name: "Editor",
    mobileName: "Editor",
    href: "/editor",
    icon: PenTool,
    locationInMobile: "sidebar",
    position: 99,
  },
  {
    category: "Notes Statistics",
    name: "Overall",
    mobileName: "Overall",
    href: "/statistics",
    icon: BarChart,
    locationInMobile: "sidebar",
    position: 6,
  },
  {
    category: "Notes Statistics",
    name: "Notes Performance",
    mobileName: "Notes Performance",
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
