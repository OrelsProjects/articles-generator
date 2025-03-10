"use client";

import { PublicationOnboarding } from "@/components/onboarding/publication-onboarding";
import { useAppSelector } from "@/lib/hooks/redux";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { useEffect } from "react";

export default function OnboardingPage() {
  const router = useCustomRouter();
  const { user } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user]);

  return <PublicationOnboarding />;
}
