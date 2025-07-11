"use client";

import { ToastStepper } from "@/components/ui/toast-stepper";
import { selectSettings } from "@/lib/features/settings/settingsSlice";
import { useAppSelector } from "@/lib/hooks/redux";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const loadingStatesConst = [
  { text: "Validating publication in our databases..." },
  { text: "Checking Substack availability..." },
  { text: "Extracting publications...", delay: 7000 },
  { text: "Analyzing writing style...", delay: 7000 },
  { text: "Generating content insights...", delay: 7000 },
  { text: "Setting up your preferences..." },
  { text: "Almost done...", delay: 7000 },
  { text: "I promise, it's almost ready...", delay: 7000 },
  {
    text: "You have a humongous publication, my machines really struggle...🤖",
    delay: 7000,
  },
  {
    text: "Okay, if you're still here, I'll let you in on a secret: I've been faking it.",
    delay: 7000,
  },
  {
    text: "The statuses are not real. I just wanted to make you feel good while you wait.",
    delay: 7000,
  },
  { text: "Well, this is awkward... Hope it finishes soon...🤦", delay: 3000 },
];

export default function OnboardingLoaderProvider({
  className,
}: {
  className?: string;
}) {
  const { settings } = useAppSelector(selectSettings);

  const showLoader = useMemo(() => {
    return settings.generatingDescription;
  }, [settings.generatingDescription]);

  return (
    <ToastStepper
      loadingStates={loadingStatesConst}
      loading={showLoader}
      duration={7000}
      loop={false}
      position="bottom-left"
      className={cn(
        "!opacity-40 hover:!opacity-100 transition-opacity",
        className,
      )}
    />
  );
}
