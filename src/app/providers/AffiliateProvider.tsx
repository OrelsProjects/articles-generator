"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Logger } from "@/logger";

export default function AffiliateProvider() {
  const searchParams = useSearchParams();
  const via = searchParams.get("via");
  const [_, setReferral] = useState<string | null>(null);

  useEffect(() => {
    // Check if rewardful is defined in the global scope
    console.log("Type of rewardful", typeof rewardful);
    if (typeof window !== "undefined" && typeof rewardful === "function") {
      console.log("Loaded rewardful");
      Logger.info(`[REFERRAL] Checking for referral`);
      rewardful("ready", function () {
        if (typeof Rewardful !== "undefined" && Rewardful.referral) {
          Logger.info(`[REFERRAL] Setting referral ${Rewardful.referral}`);
          setReferral(Rewardful.referral);
        } else {
          Logger.info(`[REFERRAL] No referral found`);
        }
      });
    }
  }, [setReferral]);

  useEffect(() => {
    if (via) {
      Logger.info(`[REFERRAL] Referral via ${via}`);
    }
  }, [via]);

  return null;
}
