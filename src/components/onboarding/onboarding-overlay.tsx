"use client";

import React, { useEffect, useState } from "react";
import { useOnboarding } from "@/app/providers/OnboardingProvider";
import { useAppSelector } from "@/lib/hooks/redux";
import { usePathname } from "next/navigation";
import { InspirationStepPopover } from "./steps/inspiration-step";
import { PremiumFilterStepPopover } from "./steps/premium-filter-step";
import { ScheduleNoteStepDialog } from "./steps/schedule-note-step";
import { useUi } from "@/lib/hooks/useUi";

const ONBOARDING_STEPS = [
  {
    id: "inspiration",
    title: "Browse Your Inspiration",
    description:
      "Browse your past wins here to beat writer's block. Click any tile to open it in the editor.",
    targetPath: "/home",
    component: InspirationStepPopover,
  },
  {
    id: "premium-filter",
    title: "Advanced Filters",
    description:
      "Use advanced filters to surface your highest-impact ideas fast.",
    requiredPlan: "premium",
    targetPath: "/home",
    component: PremiumFilterStepPopover,
  },
  {
    id: "schedule-note",
    title: "Schedule Your Notes",
    description:
      "Pick days you publish. We'll remind you and keep this graph green.",
    targetPath: "/queue",
    component: ScheduleNoteStepDialog,
  },
];

export function OnboardingOverlay() {
  const { currentStep, isOpen, hasSeen } = useOnboarding();
  const { user } = useAppSelector(state => state.auth);
  const { hasAdvancedFiltering } = useUi();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything on server or if user hasn't seen onboarding
  if (!isClient || hasSeen || !isOpen) {
    return null;
  }

  const stepConfig = ONBOARDING_STEPS[currentStep];

  // Don't render if step doesn't exist
  if (!stepConfig) {
    return null;
  }

  // Check if we're on the correct path for this step
  if (stepConfig.targetPath && pathname !== stepConfig.targetPath) {
    return null;
  }

  // Check if user has required plan for this step
  if (stepConfig.requiredPlan && user?.meta?.plan !== stepConfig.requiredPlan) {
    return null;
  }

  const StepComponent = stepConfig.component;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <StepComponent />
    </div>
  );
}
