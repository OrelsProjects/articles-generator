"use client";

import { useEffect, useRef, useState } from "react";
import usePayments from "@/lib/hooks/usePayments";
import { usePathname, useSearchParams } from "next/navigation";
import { CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
            Preparing Your Secure Payment
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
  const searchParams = useSearchParams();
  const { goToCheckout } = usePayments();
  const [loadingRedirect, setLoadingRedirect] = useState(false);
  const loadingRedirectRef = useRef(false);

  const productId = searchParams.get("pro_id");
  const priceId = searchParams.get("pri_id");
  const discountApplied = searchParams.get("promo");

  useEffect(() => {
    if (productId && priceId) {
      if (loadingRedirectRef.current) return;

      loadingRedirectRef.current = true;
      setLoadingRedirect(true);

      goToCheckout(priceId, productId).finally(() => {
        loadingRedirectRef.current = false;
        setLoadingRedirect(false);
      });
    }
  }, [productId, priceId]);

  return loadingRedirect ? <LoadingRedirect /> : children;
}
