"use client";

import { useEffect, useRef, useState } from "react";
import usePayments from "@/lib/hooks/usePayments";
import { usePathname, useSearchParams } from "next/navigation";
import { CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAppSelector } from "@/lib/hooks/redux";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";

const LoadingRedirect = () => (
  <div className="min-h-screen h-full w-full flex items-center justify-center pb-16 bg-background">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            className="mb-6"
          >
            <CreditCard className="w-16 h-16 text-primary mx-auto" />
          </motion.div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-2xl font-bold mb-4 text-foreground"
          >
            Preparing your secure payment
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-muted-foreground mb-6"
          >
            We&apos;re redirecting you to our secure payment partner, Stripe...
          </motion.p>
          <motion.div
            className="h-2 bg-secondary rounded-full overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.5, duration: 2.5, ease: "easeInOut" }}
          >
            <div className="h-full bg-primary rounded-full"></div>
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  </div>
);
export default function InitiatePlanFromLandingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useCustomRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAppSelector(state => state.auth);
  const { goToCheckout } = usePayments();
  const [loadingRedirect, setLoadingRedirect] = useState(false);
  const loadingRedirectRef = useRef(false);

  const plan = searchParams.get("plan");
  const interval = searchParams.get("interval");
  const discountApplied = searchParams.get("promo");
  const code = searchParams.get("code");

  useEffect(() => {
    if (plan && interval) {
      if (user?.meta?.plan) {
        // remove the plan and interval from the url
        router.push(pathname, {
          paramsToRemove: ["plan", "interval"],
        });
        return;
      }

      if (loadingRedirectRef.current) return;

      loadingRedirectRef.current = true;
      setLoadingRedirect(true);

      goToCheckout(interval as "month" | "year", plan).finally(() => {
        loadingRedirectRef.current = false;
        setLoadingRedirect(false);
      });
    }
  }, [plan, interval]);

  if (code) {
    // Means it's a free subscriber, no payment needed
    return children;
  }

  return loadingRedirect ? <LoadingRedirect /> : children;
}
