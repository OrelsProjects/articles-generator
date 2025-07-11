"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { appName } from "@/lib/consts";
import LanguageDropdown from "@/components/settings/ui/language-dropdown";
import TopicsSearchInput from "@/components/settings/ui/topics-search-input";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { useSession } from "next-auth/react";
import axiosInstance from "@/lib/axios-instance";
import { Logger } from "@/logger";
import { Topic } from "@/types/topic";
import { setOnboardingSetupCompleted } from "@/lib/features/settings/settingsSlice";
import useLocalStorage from "@/lib/hooks/useLocalStorage";

export interface OnboardingFormData {
  // Stage 1 - Basics
  name: string;
  iAmA: string;
  usuallyPostAbout: string;
  writeInLanguage: string;

  // Stage 2 - AI Improvements
  topics: string[];
  customTopics: string;

  // Stage 3 - More improvements
  customPrompt: string;
}

type Stage = "basics" | "ai-improvements" | "more-improvements";

const STAGES: { key: Stage; title: string; subtitle: string }[] = [
  {
    key: "basics",
    title: "Let's get to know you",
    subtitle: "Tell us about yourself and your writing style",
  },
  {
    key: "ai-improvements",
    title: "Define your topics",
    subtitle: "What do you want to post about?",
  },
  {
    key: "more-improvements",
    title: "Personalize your experience",
    subtitle: "Custom settings to make the AI work better for you",
  },
];

interface OnboardingSetupProps {
  onComplete: (data: OnboardingFormData) => void;
  loadingCompleteSetup?: boolean;
  loadingAnalysis?: boolean;
  isAnalysisCompleted?: boolean;
  isAnalysisFailed?: boolean;
}

export default function OnboardingSetup({
  onComplete,
  loadingCompleteSetup: loading = false,
  loadingAnalysis = false,
  isAnalysisCompleted = false,
  isAnalysisFailed = false,
}: OnboardingSetupProps) {
  const dispatch = useAppDispatch();
  const [onboardingSetupData, setOnboardingSetupData] =
    useLocalStorage<OnboardingFormData | null>("onboarding_setup_data", null);
  const { data: session } = useSession();
  const [popularTopics, setPopularTopics] = useState<string[]>([]);
  const [isLoadingPopularTopics, setIsLoadingPopularTopics] = useState(true);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [currentStage, setCurrentStage] = useState<Stage>("basics");
  const [hasAnimatedSuccess, setHasAnimatedSuccess] = useState(false);
  const [hasAnimatedFailure, setHasAnimatedFailure] = useState(false);

  const formik = useFormik<OnboardingFormData>({
    initialValues: onboardingSetupData || {
      name: session?.user.name || "",
      iAmA: "",
      usuallyPostAbout: "",
      writeInLanguage: "en",
      topics: [],
      customTopics: "",
      customPrompt: "",
    },
    onSubmit: values => {
      console.log("Setup completed:", values);
      dispatch(setOnboardingSetupCompleted(true));
      onComplete(values);
    },
  });

  useEffect(() => {
    if (session?.user.name) {
      formik.setFieldValue("name", session.user.name);
    }
  }, [session?.user.name]);

  useEffect(() => {
    getPopularTopics();
  }, []);

  // Track when success/failure states are first reached
  useEffect(() => {
    if (isAnalysisCompleted && !hasAnimatedSuccess) {
      setHasAnimatedSuccess(true);
    }
  }, [isAnalysisCompleted, hasAnimatedSuccess]);

  useEffect(() => {
    if (isAnalysisFailed && !hasAnimatedFailure) {
      setHasAnimatedFailure(true);
    }
  }, [isAnalysisFailed, hasAnimatedFailure]);

  const getPopularTopics = async () => {
    try {
      setIsLoadingPopularTopics(true);
      const topics = await axiosInstance.get<Topic[]>("/api/v1/topics/popular");
      setPopularTopics(topics.data.map(topic => topic.topic));
    } catch (error) {
      Logger.error("Error getting popular topics:", {
        error: error,
        userId: session?.user.id,
      });
    } finally {
      setIsLoadingPopularTopics(false);
    }
  };

  const currentStageIndex = STAGES.findIndex(
    stage => stage.key === currentStage,
  );
  const isFirstStage = currentStageIndex === 0;
  const isLastStage = currentStageIndex === STAGES.length - 1;

  const goToStage = (stage: Stage, slideDirection: "left" | "right") => {
    setDirection(slideDirection);
    setCurrentStage(stage);
  };

  const handleNext = () => {
    if (isLastStage) {
      formik.handleSubmit();
    } else {
      const nextStage = STAGES[currentStageIndex + 1];
      goToStage(nextStage.key, "left");
    }
  };

  const handleBack = () => {
    if (!isFirstStage) {
      const prevStage = STAGES[currentStageIndex - 1];
      goToStage(prevStage.key, "right");
    }
  };

  const slideVariants = {
    enter: (direction: string) => ({
      x: direction === "left" ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: string) => ({
      zIndex: 0,
      x: direction === "left" ? -300 : 300,
      opacity: 0,
      transition: {
        duration: 0.1,
      },
    }),
  };

  const handleFieldChange = (
    field: keyof OnboardingFormData,
    value: string | string[],
  ) => {
    const newValues = { ...formik.values, [field]: value };
    setOnboardingSetupData(newValues);
    formik.setValues(newValues);
  };

  const renderBasicsStage = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Your full name"
          value={formik.values.name}
          onChange={e => handleFieldChange("name", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="iAmA">I am a...</Label>
        <Input
          id="iAmA"
          placeholder="professional copywriter with amazing writing skills"
          value={formik.values.iAmA}
          onChange={e => handleFieldChange("iAmA", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="usuallyPostAbout">I usually post about...</Label>
        <Input
          id="usuallyPostAbout"
          placeholder="marketing strategies and business growth"
          value={formik.values.usuallyPostAbout}
          onChange={e => handleFieldChange("usuallyPostAbout", e.target.value)}
        />
      </div>

      <LanguageDropdown
        selectedLanguage={formik.values.writeInLanguage}
        handleLanguageChange={(value: string) => {
          handleFieldChange("writeInLanguage", value);
        }}
        savingLanguage={false}
        label="I write in..."
      />
    </div>
  );

  const renderAIImprovementsStage = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">What do you want to post about?</h3>

        <TopicsSearchInput
          selectedTopics={formik.values.topics}
          onTopicsChange={topics => handleFieldChange("topics", topics)}
          placeholder="Search for topics or type your own..."
          label="Select topics"
          popularTopics={popularTopics}
          isLoadingPopularTopics={isLoadingPopularTopics}
        />
      </div>
    </div>
  );

  const renderMoreImprovementsStage = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customPrompt">Custom prompt (Optional)</Label>
          <Textarea
            id="customPrompt"
            placeholder="Enter a personalized prompt to guide the AI..."
            value={formik.values.customPrompt}
            onChange={e => handleFieldChange("customPrompt", e.target.value)}
            rows={6}
          />
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Your custom prompt will enhance the
            description {appName} generates, but won&apos;t replace it
            completely. This allows you to add your personal touch while
            maintaining the AI&apos;s effectiveness.
          </p>
        </div>
      </div>
    </div>
  );

  const renderAnalysisStatus = () => {
    if (!loadingAnalysis && !isAnalysisCompleted && !isAnalysisFailed) {
      return null;
    }

    // Determine the current state for styling
    const getStatusClasses = () => {
      if (loadingAnalysis) {
        return "bg-muted border-muted-foreground/20";
      } else if (isAnalysisCompleted) {
        return "bg-green-50 border-green-200";
      } else if (isAnalysisFailed) {
        return "bg-blue-50 border-blue-200";
      }
      return "bg-muted border-muted-foreground/20";
    };

    return (
      <div className="flex justify-center mb-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center gap-3 px-4 py-2 border rounded-full transition-colors duration-500 ease-in-out ${getStatusClasses()}`}
        >
          <AnimatePresence mode="wait">
            {loadingAnalysis && (
              <motion.div
                key="loading-content"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3"
              >
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                <span className="text-sm font-medium text-muted-foreground">
                  Analyzing your publication...
                </span>
              </motion.div>
            )}

            {isAnalysisCompleted && !loadingAnalysis && (
              <motion.div
                key="success-content"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  initial={
                    hasAnimatedSuccess
                      ? { scale: 1, rotate: 0 }
                      : { scale: 0, rotate: -180 }
                  }
                  animate={{ scale: 1, rotate: 0 }}
                  transition={
                    hasAnimatedSuccess
                      ? { duration: 0 }
                      : {
                          delay: 0.1,
                          type: "spring",
                          stiffness: 200,
                          damping: 15,
                        }
                  }
                  className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
                <motion.span
                  initial={hasAnimatedSuccess ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={
                    hasAnimatedSuccess ? { duration: 0 } : { delay: 0.2 }
                  }
                  className="text-sm font-medium text-green-700"
                >
                  Analysis completed successfully!
                </motion.span>
              </motion.div>
            )}

            {isAnalysisFailed && !loadingAnalysis && (
              <motion.div
                key="error-content"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  initial={
                    hasAnimatedFailure
                      ? { scale: 1, rotate: 0 }
                      : { scale: 0, rotate: 180 }
                  }
                  animate={{ scale: 1, rotate: 0 }}
                  transition={
                    hasAnimatedFailure
                      ? { duration: 0 }
                      : {
                          delay: 0.1,
                          type: "spring",
                          stiffness: 200,
                          damping: 15,
                        }
                  }
                  className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <AlertTriangle className="w-4 h-4 text-white" />
                </motion.div>
                <motion.span
                  initial={hasAnimatedFailure ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={
                    hasAnimatedFailure ? { duration: 0 } : { delay: 0.2 }
                  }
                  className="text-sm font-medium text-blue-700"
                >
                  Analysis failed. You can complete the setup and try again.
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  };

  const getCurrentStageContent = () => {
    switch (currentStage) {
      case "basics":
        return renderBasicsStage();
      case "ai-improvements":
        return renderAIImprovementsStage();
      case "more-improvements":
        return renderMoreImprovementsStage();
      default:
        return renderBasicsStage();
    }
  };

  const currentStageInfo = STAGES[currentStageIndex];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-6">
        {/* Stage content with animation */}
        <div className="relative min-h-[500px] overflow-hidden">
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={currentStage}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: {
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  duration: 0.5,
                },
                opacity: { duration: 0.2 },
              }}
              className="absolute inset-0"
            >
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold">
                    {currentStageInfo.title}
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    {currentStageInfo.subtitle}
                  </p>
                </div>

                {/* Analysis Status Indicator */}
                {renderAnalysisStatus()}

                {getCurrentStageContent()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress indicator and navigation */}
        <div className="space-y-6">
          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isFirstStage}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="flex justify-center space-x-2">
              {STAGES.map((stage, index) => (
                <div
                  key={stage.key}
                  className={`w-3 h-3 rounded-full ${
                    index <= currentStageIndex ? "bg-primary" : "bg-muted"
                  } transition-colors duration-200`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="flex items-center gap-2"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLastStage ? "Complete Setup" : "Next"}
              {!isLastStage && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground text-center">
          💡 You can always update your these in the settings.
        </p>
      </div>
    </div>
  );
}
