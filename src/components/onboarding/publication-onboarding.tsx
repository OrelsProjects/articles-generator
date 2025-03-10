"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnalyzePublicationButton } from "@/components/ui/text-editor/analyze-publication-button";
import { useSettings } from "@/lib/hooks/useSettings";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import Logo from "@/components/ui/logo";
import Image from "next/image";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { useSearchParams } from "next/navigation";
import usePayments from "@/lib/hooks/usePayments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "WriteRoom";

export function PublicationOnboarding() {
  const router = useCustomRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { user } = useAppSelector(state => state.auth);
  const plan = searchParams.get("plan");
  const interval = searchParams.get("interval");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { hasPublication } = useSettings();
  const { goToCheckout } = usePayments();

  useEffect(() => {
    if (hasPublication) {
      if (user?.meta?.plan) {
        router.push("/home");
      } else if (plan && interval) {
        // goToCheckout(interval as "month" | "year", plan);
        setShowPaymentDialog(true);
      } else {
        router.push("/pricing?onboarding=true");
      }
    }
  }, [hasPublication, router, dispatch, plan, interval]);

  // Prevent navigation if user doesn't have a publication
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasPublication) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasPublication]);

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
    <div className="w-screen h-screen flex flex-col items-center justify-center min-h-screen bg-background p-4 relative">
      <Image
        src="/home-dark.png"
        alt="Home"
        fill
        className="absolute inset-0 object-fill hidden dark:block z-10"
      />
      <Image
        src="/home-light.png"
        alt="Home"
        fill
        className="absolute inset-0 object-fill block dark:hidden z-10"
      />
      <div className="absolute inset-0 bg-foreground/70 dark:bg-background/50 backdrop-blur-sm z-20" />
      <Card className="w-full max-w-md z-30">
        <CardHeader>
          {/* <div className="w-full flex items-center justify-center"> */}
          <Logo className="w-10 h-10" />
          {/* </div> */}
          <CardTitle className="text-2xl">Welcome to {appName}</CardTitle>
          <CardDescription>
            Before you can start, we need to connect your publication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {appName} works by analyzing your existing content to help you
            create better notes and ideas. Please connect your publication to
            continue.
          </p>
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm font-medium">What you&apos;ll need:</p>
            <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
              <li>Your publication URL (e.g., yourname.substack.com)</li>
              <li>
                Public access to your publication (Paid publications is also
                okay)
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <AnalyzePublicationButton variant="default" className="w-full" />
        </CardFooter>
      </Card>
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
              Confirm payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
