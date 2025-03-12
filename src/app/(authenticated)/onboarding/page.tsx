"use client";

import { PublicationOnboarding } from "@/components/onboarding/publication-onboarding";
import { useAppSelector } from "@/lib/hooks/redux";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSettings } from "@/lib/hooks/useSettings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import usePayments from "@/lib/hooks/usePayments";
export default function OnboardingPage() {
  const router = useCustomRouter();
  const { user } = useAppSelector(state => state.auth);
  const { hasPublication } = useSettings();
  const { goToCheckout } = usePayments();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const interval = searchParams.get("interval");

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    debugger;
    if (hasPublication) {
      if (user?.meta?.plan) {
        router.push("/home", { paramsToRemove: ["plan", "interval"] });
      } else if (plan && interval) {
        // goToCheckout(interval as "month" | "year", plan);
        setShowPaymentDialog(true);
      } else {
        router.push("/pricing?onboarding=true");
      }
    }
  }, [hasPublication, router, plan, interval]);

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user]);

  const handlePaymentDialogChange = (open: boolean) => {
    if (!open) {
      if (plan && interval) {
        goToCheckout(interval as "month" | "year", plan);
      } else {
        router.push("/pricing?onboarding=true");
      }
    } else {
      setShowPaymentDialog(true);
    }
  };
  return (
    <>
      <PublicationOnboarding />;
      <Dialog open={showPaymentDialog} onOpenChange={handlePaymentDialogChange}>
        <DialogContent closeOnOutsideClick={false}>
          <DialogHeader>
            <DialogTitle>Almost done!</DialogTitle>
            <DialogDescription>
              The last step is to{" "}
              {plan && interval ? "confirm your payment" : "choose a plan"} and
              start writing!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                handlePaymentDialogChange(false);
              }}
              variant="default"
            >
              Let&apos;s go!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
