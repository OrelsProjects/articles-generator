"use client";

import { useEffect } from "react";
import useLocalStorage from "@/lib/hooks/useLocalStorage";

export default function AffiliateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [referral, setReferral] = useLocalStorage<string | null>(
    "referral",
    null,
  );

  useEffect(() => {
    // Check if rewardful is defined in the global scope
    if (typeof window !== "undefined" && typeof rewardful === "function") {
      rewardful("ready", function () {
        if (typeof Rewardful !== "undefined" && Rewardful.referral) {
          setReferral(Rewardful.referral);
        }
      });
    }
  }, [setReferral]);

  return children;
}
