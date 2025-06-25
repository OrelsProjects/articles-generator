"use client";

import usePayments from "@/lib/hooks/usePayments";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { useEffect, useState } from "react";

export default function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { verifySubscription } = usePayments();
  const [hasSubscription, setHasSubscription] = useState<
    "pending" | "success" | "error"
  >("pending");

  const router = useCustomRouter();
  const handleVerifySubscription = async () => {
    try {
      await verifySubscription();
      setHasSubscription("success");
    } catch (error) {
      setHasSubscription("error");
    }
  };

  useEffect(() => {
    handleVerifySubscription();
  }, []);

  if (hasSubscription === "error") {
    router.redirect("/pricing?onboarding=true");
  }

  return children;
}
