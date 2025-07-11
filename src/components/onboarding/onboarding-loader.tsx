"use client";

import { ToastStepper } from "@/components/ui/toast-stepper";
import { selectSettings } from "@/lib/features/settings/settingsSlice";
import { useAppSelector } from "@/lib/hooks/redux";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";

const loadingStatesConst = [
  { text: "Validating publication in our databases..." },
  { text: "Checking Substack availability..." },
  { text: "Extracting publications...", delay: 10000 },
  { text: "Analyzing writing style...", delay: 10000 },
  { text: "Generating content insights...", delay: 10000 },
  { text: "Setting up your preferences...", delay: 10000 },
  { text: "Almost done...", delay: 10000 },
  { text: "I promise, it's almost ready...", delay: 10000 },
  {
    text: "You have a humongous publication, my machines really struggle...🤖",
    delay: 10000,
  },
  {
    text: "Okay, if you're still here, I'll let you in on a secret: I've been faking it.",
    delay: 10000,
  },
  {
    text: "The statuses are not real. I just wanted to make you feel good while you wait.",
    delay: 10000,
  },
  { text: "Well, this is awkward... Hope it finishes soon...🤦", delay: 10000 },
];

export default function OnboardingLoader({
  className,
}: {
  className?: string;
}) {
  const { settings } = useAppSelector(selectSettings);

  const showLoader = useMemo(() => {
    return settings.generatingDescription;
  }, [settings.generatingDescription]);

  return (
    <motion.div
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className={cn(className)}
    >
      <MultiStepLoader
        loadingStates={loadingStatesConst}
        loading={showLoader}
        duration={7000}
        loop={false}
      />
    </motion.div>
  );
}
