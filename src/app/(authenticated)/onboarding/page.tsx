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
import axios from "axios";
import { toast } from "react-toastify";

export default function OnboardingPage() {
  const router = useCustomRouter();
  const [loadingAnalyzed, setLoadingAnalyzed] = useState(false);
  const { user } = useAppSelector(state => state.auth);
  const { hasPublication } = useSettings();
  const { goToCheckout } = usePayments();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const interval = searchParams.get("interval");

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const handleNavigateNext = () => {
    if (user?.meta?.plan) {
      router.push("/home", { paramsToRemove: ["plan", "interval"] });
    } else if (plan && interval) {
      setShowPaymentDialog(true);
    } else {
      router.push("/pricing?onboarding=true");
    }
  };

  const handleAlreadyAnalyzed = async () => {
    try {
      setLoadingAnalyzed(true);
      await axios.post("/api/user/publications/validate-analysis");
      handleNavigateNext();
    } catch (error) {
      console.error(error);
      toast.error("It seems like you haven't analyzed your publication yet.");
    } finally {
      setLoadingAnalyzed(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
    if (hasPublication) {
      handleNavigateNext();
    }
  }, [user, hasPublication, handleNavigateNext]);

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

  const handleAnalyzed = () => {
    setShowPaymentDialog(true);
  };

  return (
    <>
      <PublicationOnboarding
        onAnalyzed={handleAnalyzed}
        onAlreadyAnalyzed={handleAlreadyAnalyzed}
        loadingAnalyzed={loadingAnalyzed}
      />
      <Dialog open={showPaymentDialog} onOpenChange={handlePaymentDialogChange}>
        <DialogContent closeOnOutsideClick={false}>
          <DialogHeader>
            <DialogTitle aria-label="Almost done!">Almost done!</DialogTitle>
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
