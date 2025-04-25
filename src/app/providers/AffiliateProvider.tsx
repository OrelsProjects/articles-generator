"use client";

import { useEffect } from "react";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import Script from "next/script";

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
  // <script>(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');</script>
  // <script async src="https://r.wdfl.co/rw.js" data-rewardful="00b47f"></script>;
  return (
    <>
      <Script
        src="https://r.wdfl.co/rw.js"
        data-rewardful="00b47f"
        strategy="beforeInteractive"
      />
      <Script id="rewardful-script" strategy="beforeInteractive">
        {`(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`}
      </Script>
      {children}
    </>
  );
}
