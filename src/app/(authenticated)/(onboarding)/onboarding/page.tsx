"use client";

import { PublicationOnboarding } from "@/components/onboarding/publication-onboarding";
import OnboardingSetup, {
  OnboardingFormData,
} from "@/components/onboarding/onboarding-setup";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import usePayments from "@/lib/hooks/usePayments";
import axiosInstance from "@/lib/axios-instance";
import { toast } from "react-toastify";
import { Logger } from "@/logger";
import { rootPath } from "@/types/navbar";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/ui/logo";
import OnboardingLoader from "@/components/onboarding/onboarding-loader";
import { cn } from "@/lib/utils";
import { setGeneratingDescription } from "@/lib/features/settings/settingsSlice";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import { useSession } from "next-auth/react";
import { usePublicationSettings } from "@/lib/hooks/usePublicationSettings";

export default function OnboardingPage() {
  const router = useCustomRouter();
  const dispatch = useAppDispatch();
  const { publicationSettings } = usePublicationSettings();
  const { data: session } = useSession();
  const [loadingAnalyzed, setLoadingAnalyzed] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupCompleted, setSetupCompleted] = useLocalStorage<boolean>(
    "onboarding_setup_completed",
    false,
  );
  const [onboardingSetupData] = useLocalStorage<OnboardingFormData | null>(
    "onboarding_setup_data",
    null,
  );

  const [completedAnalysisNoSetup, setCompletedAnalysisNoSetup] =
    useState(false);
  const [isAnalysisCompleted, setIsAnalysisCompleted] = useState(false);
  const [loadingCompleteSetup, setLoadingCompleteSetup] = useState(false);
  const [analysisFailed, setAnalysisFailed] = useState(false);

  const { user } = useAppSelector(state => state.auth);
  const { settings } = useAppSelector(state => state.settings);
  const { hasPublication } = useSettings();
  const { goToCheckout } = usePayments();
  const searchParams = useSearchParams();

  const setupData = useRef<OnboardingFormData | null>(null);
  const setupCompletedRef = useRef(false);

  const plan = searchParams.get("plan");
  const interval = searchParams.get("interval");
  const coupon = searchParams.get("coupon");

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    if (onboardingSetupData) {
      setupData.current = onboardingSetupData;
    }
    if (session?.user) {
      const meta = session.user.meta;
      if (meta) {
        const newSetupData = {
          ...onboardingSetupData,
          iAmA: meta.iAmA || "",
          usuallyPostAbout: meta.usuallyPostAbout || "",
          writeInLanguage: meta.preferredLanguage || "",
          topics: publicationSettings?.preferredTopics || [],
          customPrompt: publicationSettings?.personalDescription || "",
          name: session.user.name || onboardingSetupData?.name || "",
          customTopics: onboardingSetupData?.customTopics || "",
        };
        setupData.current = newSetupData;
      }
    }
  }, [onboardingSetupData]);

  const updateSetupCompleted = useCallback(
    (completed: boolean) => {
      setSetupCompleted(completed);
      setupCompletedRef.current = completed;
    },
    [setSetupCompleted, setupCompletedRef],
  );

  const handleNavigateNext = () => {
    if (user?.meta?.plan) {
      router.push(rootPath, { paramsToRemove: ["plan", "interval", "coupon"] });
    } else if (plan && interval) {
      setShowPaymentDialog(true);
    } else {
      router.push("/pricing?onboarding=true");
    }
  };

  const handleAlreadyAnalyzed = async () => {
    try {
      setLoadingAnalyzed(true);
      await axiosInstance.post("/api/user/publications/validate-analysis");
      handleNavigateNext();
    } catch (error) {
      Logger.error("Error validating publication analysis", { error });
      toast.info("It seems like you haven't analyzed your publication yet.");
    } finally {
      setLoadingAnalyzed(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
    if (hasPublication && setupCompleted) {
      handleNavigateNext();
    }
  }, [user, hasPublication, handleNavigateNext]);

  const handlePaymentDialogChange = (open: boolean) => {
    if (!open) {
      if (plan && interval) {
        goToCheckout(interval as "month" | "year", plan, coupon || undefined);
      } else {
        router.push("/pricing?onboarding=true");
      }
    } else {
      setShowPaymentDialog(true);
    }
  };

  const handleAnalyzed = useCallback(
    async (forceSave = false, data?: OnboardingFormData) => {
      setIsAnalysisCompleted(true);
      Logger.info("handleAnalyzed", {
        forceSave,
        data,
        setupData: setupData.current,
        setupCompleted,
      });
      
      try {
        // Save the onboarding data
        if (
          (setupData.current && setupCompletedRef.current) ||
          data ||
          forceSave
        ) {
          await axiosInstance.post(
            "/api/onboarding/save",
            data || setupData.current,
          );
          // clear local storage
          setShowPaymentDialog(true);
          updateSetupCompleted(true);
          setShowSetup(false);
        } else {
          setCompletedAnalysisNoSetup(true);
        }
        // Analysis will be completed automatically and handled by the loader provider
      } catch (error) {
        Logger.error("Error saving onboarding data", { error });
        toast.error("Failed to save setup data. Please try again.");
        throw error;
      }
    },
    [setupData.current, setupCompletedRef.current],
  );

  const handleSetupComplete = async (data: OnboardingFormData) => {
    setupData.current = data;
    if (analysisFailed) {
      updateSetupCompleted(true);
      setShowSetup(false);
      dispatch(setGeneratingDescription(false));
      toast.info("Something went wrong.. Try again (Your data was saved).", {
        autoClose: 3000,
      });
      return;
    }

    if (completedAnalysisNoSetup) {
      setLoadingCompleteSetup(true);
      handleAnalyzed(true, data)
        .catch(() => {
          // do nothing
        })
        .finally(() => {
          setLoadingCompleteSetup(false);
          updateSetupCompleted(true);
        });
    } else {
      setShowSetup(false);
      updateSetupCompleted(true);
    }
  };

  const handleAnalysisStarted = async () => {
    setShowSetup(true);
    setIsAnalysisCompleted(false);
    setAnalysisFailed(false);
    dispatch(setGeneratingDescription(true));
  };

  const handleAnalysisFailed = () => {
    setAnalysisFailed(true);
    if (!showSetup) {
      dispatch(setGeneratingDescription(false));
      toast.info("Something went wrong.. Try again (Your data was saved).", {
        autoClose: 3000,
      });
    }
  };

  // Check if we should show the analysis completion
  useEffect(() => {
    if (
      settings.onboardingSetupCompleted &&
      !settings.generatingDescription &&
      hasPublication
    ) {
      handleNavigateNext();
    }
  }, [
    settings.onboardingSetupCompleted,
    settings.generatingDescription,
    hasPublication,
  ]);

  const fadeVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.1, ease: "easeInOut" },
    },
  };

  const isSetupCompleted = useMemo(() => {
    return setupCompletedRef.current || setupCompleted;
  }, [setupCompletedRef.current, setupCompleted]);

  return (
    <div className="relative">
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4 z-50">
        {/* Always render PublicationOnboarding but control visibility */}
        <AnimatePresence mode="wait">
          {!showSetup || isSetupCompleted ? (
            <motion.div
              key="publication-onboarding"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <PublicationOnboarding
                onAnalyzed={handleAnalyzed}
                onAlreadyAnalyzed={handleAlreadyAnalyzed}
                loadingAnalyzed={loadingAnalyzed}
                onAnalyzing={handleAnalysisStarted}
                onAnalysisFailed={handleAnalysisFailed}
              />
            </motion.div>
          ) : (
            !isSetupCompleted && (
              <motion.div
                key="onboarding-setup"
                variants={fadeVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="w-full z-50"
              >
                <Card className="w-full max-w-4xl mx-auto">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <Logo />
                    </div>
                  </CardHeader>
                  <CardContent className="min-h-[600px] flex items-center justify-center">
                    <OnboardingSetup
                      onComplete={handleSetupComplete}
                      loadingCompleteSetup={loadingCompleteSetup}
                      loadingAnalysis={settings.generatingDescription}
                      isAnalysisCompleted={isAnalysisCompleted}
                      isAnalysisFailed={analysisFailed}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>

      <Dialog
        open={showPaymentDialog && setupCompleted}
        onOpenChange={handlePaymentDialogChange}
      >
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
      <OnboardingLoader
        className={cn({
          "z-[-1] opacity-0": showSetup,
          "z-50 opacity-100": !showSetup || setupCompleted,
        })}
      />
    </div>
  );
}
