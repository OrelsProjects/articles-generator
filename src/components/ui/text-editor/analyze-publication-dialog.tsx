"use client";

import { usePublication } from "@/lib/hooks/usePublication";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { AlertCircle, AlertTriangle, HelpCircle, Link2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { validateSubstackUrl, validateUrl } from "@/lib/utils/url";
import { AnimatePresence, motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Logger } from "@/logger";
import { setShowAnalyzePublicationDialog } from "@/lib/features/ui/uiSlice";

const loadingStatesConst = [
  { text: "Validating publication in our databases..." },
  { text: "Checking Substack availability..." },
  { text: "Extracting publications...", delay: 7000 },
  { text: "Analyzing writing style...", delay: 6000 },
  { text: "Generating content insights...", delay: 4000 },
  { text: "Setting up your preferences..." },
  { text: "Almost done..." },
];

const ERRORS = {
  INVALID_URL: {
    value: "URL is invalid 🤔",
    type: "warn" as const,
    explanation:
      "Make sure your URL follows the format: your-blog.substack.com",
  },
  INVALID_SUBSTACK_URL: {
    value: "Something's wrong with your URL 🤔",
    type: "warn" as const,
    explanation:
      "A valid URL looks like this: <strong>your-blog.substack.com</strong> or <strong>your-blog.com/co/ai/etc</strong>",
  },
  PUBLICATION_NOT_FOUND: {
    value: "Publication not found 🤔",
    type: "warn" as const,
    explanation: "Please check your URL and try again.",
  },
  GENERAL_ERROR: {
    value: "Something went wrong while analyzing your publication",
    type: "error" as const,
    explanation: "Please try again. If the problem persists, contact support.",
  },
};

const MotionAlert = motion(Alert);

interface ErrorState {
  value: string;
  type: "error" | "warn";
  explanation: string;
}

interface AnalyzePublicationDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AnalyzePublicationDialog({
  open,
  onOpenChange,
}: AnalyzePublicationDialogProps) {
  const dispatch = useAppDispatch();
  const { analyzePublication, validatePublication } = usePublication();
  const { publications } = useAppSelector(state => state.publications);
  const { showAnalyzePublicationDialog } = useAppSelector(state => state.ui);
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [loadingStates, setLoadingStates] = useState(loadingStatesConst);

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  useEffect(() => {
    if (showAnalyzePublicationDialog) {
      setIsOpen(true);
      dispatch(setShowAnalyzePublicationDialog(false));
    }
  }, [showAnalyzePublicationDialog]);

  useEffect(() => {
    if (publications.length > 0) {
      setIsOpen(false);
    }
  }, [publications]);

  const handleSubmit = async () => {
    if (!validateUrl(url)) {
      setError(ERRORS.INVALID_URL);
      return;
    }
    if (!validateSubstackUrl(url)) {
      setError(ERRORS.INVALID_SUBSTACK_URL);
      return;
    }
    setError(null);
    setLoading(true);
    setIsOpen(false);
    try {
      const { valid, hasPublication } = await validatePublication(url);
      if (!valid) {
        setError(ERRORS.INVALID_SUBSTACK_URL);
        setIsOpen(true);
        return;
      }
      if (hasPublication) {
        // Make time to fetch publication shorter
        const newLoadingStates = loadingStates.map(state => ({
          ...state,
          delay: state.delay ? state.delay / 2 : 1500,
        }));
        setLoadingStates(newLoadingStates);
      }
      await analyzePublication(url);
    } catch (error: any) {
      Logger.error("Error analyzing publication:", error);
      if (error.response?.status === 404) {
        setError({
          ...ERRORS.PUBLICATION_NOT_FOUND,
          value: error.response?.data?.error,
        });
      } else {
        const errorMessage =
          error instanceof Error ? error.message : ERRORS.GENERAL_ERROR.value;
        setError({
          ...ERRORS.GENERAL_ERROR,
          value: errorMessage,
        });
      }
      setIsOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="create-publication-button">
      <Dialog
        open={isOpen}
        onOpenChange={open => {
          onOpenChange?.(open);
          setIsOpen(open);
        }}
      >
        <DialogContent
          className="sm:max-w-[425px]"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Connect your Substack</DialogTitle>
            <DialogDescription>
              Enter your Substack URL to connect your newsletter. We&apos;ll
              analyze your content and writing style.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Input
              id="substackUrl"
              placeholder="your-blog.substack.com"
              className="col-span-4"
              value={url}
              onChange={e => setUrl(e.target.value)}
              // disabled={loading}
              autoFocus
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />

            <AnimatePresence mode="popLayout">
              {error?.value && (
                <MotionAlert
                  key={error.value}
                  variant={error.type === "error" ? "destructive" : "warning"}
                  className="flex flex-row items-center pb-1.5 pr-2"
                >
                  {error.type === "error" ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription className="flex-1 leading-7">
                    {error.value}
                  </AlertDescription>
                  <TooltipProvider delayDuration={350}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full !p-0 !pb-1.5"
                          type="button"
                        >
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p
                          className="text-sm"
                          dangerouslySetInnerHTML={{
                            __html: error.explanation,
                          }}
                        />
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </MotionAlert>
              )}
            </AnimatePresence>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={!url.trim() || loading}
            >
              {loading ? "Analyzing..." : "Connect Newsletter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MultiStepLoader
        loadingStates={loadingStates}
        loading={loading}
        duration={3000}
        loop={false}
      />
    </div>
  );
}
