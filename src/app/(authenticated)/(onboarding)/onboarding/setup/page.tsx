"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFormik } from "formik";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Logo from "@/components/ui/logo";
import { appName } from "@/lib/consts";
import LanguageDropdown from "@/components/settings/ui/language-dropdown";
import TopicsSearchInput from "@/components/settings/ui/topics-search-input";

interface OnboardingFormData {
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

export default function OnboardingSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStage = (searchParams.get("stage") as Stage) || "basics";
  const [direction, setDirection] = useState<"left" | "right">("left");

  const formik = useFormik<OnboardingFormData>({
    initialValues: {
      name: "",
      iAmA: "",
      usuallyPostAbout: "",
      writeInLanguage: "en",
      topics: [],
      customTopics: "",
      customPrompt: "",
    },
    onSubmit: values => {
      console.log("Form submitted:", values);
      // TODO: Save to backend - not implementing final logic as requested
      router.push("/"); // Navigate to home after completion
    },
  });

  const currentStageIndex = STAGES.findIndex(
    stage => stage.key === currentStage,
  );
  const isFirstStage = currentStageIndex === 0;
  const isLastStage = currentStageIndex === STAGES.length - 1;

  const goToStage = (stage: Stage, slideDirection: "left" | "right") => {
    setDirection(slideDirection);
    const params = new URLSearchParams(searchParams.toString());
    params.set("stage", stage);
    router.push(`?${params.toString()}`);
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
    }),
  };

  const renderBasicsStage = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Your full name"
          value={formik.values.name}
          onChange={formik.handleChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="iAmA">I am a...</Label>
        <Input
          id="iAmA"
          placeholder="professional copywriter with amazing writing skills"
          value={formik.values.iAmA}
          onChange={formik.handleChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="usuallyPostAbout">I usually post about...</Label>
        <Input
          id="usuallyPostAbout"
          placeholder="marketing strategies and business growth"
          value={formik.values.usuallyPostAbout}
          onChange={formik.handleChange}
        />
      </div>

      <LanguageDropdown
        selectedLanguage={formik.values.writeInLanguage}
        handleLanguageChange={(value: string) => {
          formik.setFieldValue("writeInLanguage", value);
        }}
        savingLanguage={false}
        label="I write in..."
      />

      {/* <p className="text-sm text-muted-foreground">
        💡 Don&apos;t worry, you can update these settings later in your
        profile.
      </p> */}
    </div>
  );

  const renderAIImprovementsStage = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">What do you want to post about?</h3>

        <TopicsSearchInput
          selectedTopics={formik.values.topics}
          onTopicsChange={(topics) => formik.setFieldValue("topics", topics)}
          placeholder="Search for topics or type your own..."
          label="Select topics"
          maxTopics={15}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        💡 You can always update your topics later in settings.
      </p>
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
            onChange={formik.handleChange}
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

      <p className="text-sm text-muted-foreground">
        💡 You can modify your custom prompt anytime in settings.
      </p>
    </div>
  );

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
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
        </CardHeader>

        <CardContent className="h-[600px] space-y-6 flex flex-col justify-between max-h-[80vh] overflow-y-auto overflow-x-hidden">
          {/* Stage content with animation */}
          <div className="relative">
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

                  {getCurrentStageContent()}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          {/* Progress indicator */}
          <div>
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
            {/* Navigation buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isFirstStage}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              <Button onClick={handleNext} className="flex items-center gap-2">
                {isLastStage ? "Complete Setup" : "Next"}
                {!isLastStage && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
