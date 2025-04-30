"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import { Logger } from "@/logger";

const API_KEY = process.env.NEXT_PUBLIC_AFFILIATE_API_KEY;

export default function AffiliateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const via = searchParams.get("via");
  const [referral, setReferral] = useState<string | null>(null);

  useEffect(() => {
    // Check if rewardful is defined in the global scope
    if (typeof window !== "undefined" && typeof rewardful === "function") {
      Logger.info(`[REFERRAL] Checking for referral`);
      rewardful("ready", function () {
        if (typeof Rewardful !== "undefined" && Rewardful.referral) {
          Logger.info(`[REFERRAL] Setting referral`);
          setReferral(Rewardful.referral);
        } else {
          Logger.info(`[REFERRAL] No referral found`);
        }
      });
    }
  }, [setReferral]);

  useEffect(() => {
    if (via) {
      Logger.info(`[REFERRAL]Referral via ${via}`);
    }
  }, [via]);

  return (
    <>
      <Script src="https://r.wdfl.co/rw.js" data-rewardful={API_KEY} />
      <Script id="rewardful-queue" strategy="beforeInteractive">
        {`(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`}
      </Script>
      {children}
    </>
  );
}
