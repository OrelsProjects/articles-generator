"use client";

import { useEffect } from "react";
import useLocalStorage from "@/lib/hooks/useLocalStorage";

export default function AffiliateProvider({ children }) {
  const [, setReferral] = useLocalStorage("referral", null);

  useEffect(() => {
    if (rewardful) {
      rewardful("ready", function () {
        setReferral(Rewardful.referral);
      });
    }
  }, [rewardful]);

  return children;
}
