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
import { AlertCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { AlertDescription } from "@/components/ui/alert";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { validateSubstackUrl, validateUrl } from "@/lib/utils/url";
import { AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Logger } from "@/logger";
import { setShowAnalyzePublicationDialog } from "@/lib/features/ui/uiSlice";
import { MotionAlert } from "@/components/ui/motion-components";
import { Byline } from "@/types/article";
import { toast } from "react-toastify";
import { AuthorSelectionDialog } from "@/components/onboarding/author-selection-dialog";

const loadingStatesConst = [
  { text: "Validating publication in our databases..." },
  { text: "Checking Substack availability..." },
  { text: "Extracting publications...", delay: 7000 },
  { text: "Analyzing writing style...", delay: 6000 },
  { text: "Generating content insights...", delay: 4000 },
  { text: "Setting up your preferences..." },
  { text: "Almost done...", delay: 3000 },
  { text: "I promise, it's almost ready...", delay: 3000 },
  {
    text: "You have a humongous publication, my machines really struggle...🤖",
    delay: 10000,
  },
  {
    text: "Okay, if you're still here, I'll let you in on a secret: I've been faking it.",
    delay: 10000,
  },
  {
    text: "The statuses are not real. I just wanted to make you feel good while you wait.",
    delay: 10000,
  },
  { text: "Well, this is awkward... Hope it finishes soon...🤦", delay: 3000 },
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
  const [loadingBylines, setLoadingBylines] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [loadingStates, setLoadingStates] = useState(loadingStatesConst);
  const [openAuthorSelectionDialog, setOpenAuthorSelectionDialog] =
    useState(false);
  const [bylines, setBylines] = useState<Byline[]>([]);
  const [hasPublication, setHasPublication] = useState(false);

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

  const getBylines = async () => {
    if (loading) return;
    try {
      setLoadingBylines(true);
      const { valid, hasPublication } = await validatePublication(url);
      if (!valid) {
        setError(ERRORS.INVALID_SUBSTACK_URL);
        return;
      }
      setHasPublication(hasPublication);
      const response = await fetch(`/api/publication/bylines?url=${url}`);
      const data = await response.json();
      setBylines(data);
      setOpenAuthorSelectionDialog(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch bylines");
    } finally {
      setLoadingBylines(false);
    }
  };

  const handleSubmit = async (byline: Byline) => {
    if (loading) return;
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
      if (hasPublication) {
        // Make time to fetch publication shorter
        const newLoadingStates = loadingStates.map(state => ({
          ...state,
          delay: state.delay ? state.delay / 2 : 1500,
        }));
        setLoadingStates(newLoadingStates);
      }
      setOpenAuthorSelectionDialog(false);
      await analyzePublication(url, byline);
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
                  getBylines();
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
              onClick={getBylines}
              disabled={!url.trim() || loading || loadingBylines}
            >
              {loading || loadingBylines
                ? "Analyzing..."
                : "Connect Newsletter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AuthorSelectionDialog
        open={openAuthorSelectionDialog}
        onOpenChange={setOpenAuthorSelectionDialog}
        bylines={bylines}
        onSelect={handleSubmit}
      />

      <MultiStepLoader
        loadingStates={loadingStates}
        loading={loading}
        duration={3000}
        loop={false}
      />
    </div>
  );
}
