"use client";

import { usePublication } from "@/lib/hooks/usePublication";
import { useEffect, useRef, useState } from "react";
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
import { AlertCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { AlertDescription } from "@/components/ui/alert";
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
import { MotionAlert } from "@/components/ui/motion-components";
import { Byline } from "@/types/article";
import { toast } from "react-toastify";
import { AuthorSelectionDialog } from "@/components/onboarding/author-selection-dialog";
import axiosInstance from "@/lib/axios-instance";
import HowToFindNewsletterUrlDialog from "@/components/ui/how-to-find-newsletter-url-dialog";
import { setGeneratingDescription } from "@/lib/features/settings/settingsSlice";
import { setAnalysisError } from "@/lib/features/publications/publicationSlice";

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

interface AnalyzePublicationDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAnalyzing?: (analyzing: boolean) => void;
  onAnalyzed?: () => Promise<unknown>;
  onAnalysisFailed?: () => void;
  hide?: boolean;
}

export function AnalyzePublicationDialog({
  open,
  onOpenChange,
  onAnalyzing,
  onAnalyzed,
  onAnalysisFailed,
  hide = false,
}: AnalyzePublicationDialogProps) {
  const dispatch = useAppDispatch();
  const { analyzePublication, validatePublication } = usePublication();
  const { analysisError } = useAppSelector(state => state.publications);
  const { showAnalyzePublicationDialog } = useAppSelector(state => state.ui);
  const { settings } = useAppSelector(state => state.settings);
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingBylines, setLoadingBylines] = useState(false);
  const [openAuthorSelectionDialog, setOpenAuthorSelectionDialog] =
    useState(false);
  const [bylines, setBylines] = useState<Byline[]>([]);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [selectedByline, setSelectedByline] = useState<Byline | null>(null);

  const loadingAnalyze = useRef(false);

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

  const getBylines = async () => {
    if (loading) return;
    try {
      setLoadingBylines(true);
      dispatch(setAnalysisError(null));
      const { valid, validUrl } = await validatePublication(url);
      if (!valid) {
        dispatch(setAnalysisError(ERRORS.INVALID_SUBSTACK_URL));
        return;
      }
      if (validUrl) {
        setUrl(validUrl);
      }
      const response = await axiosInstance.post(`/api/publication/bylines`, {
        url: validUrl || url,
      });
      const data = response.data;
      setBylines(data || []);
      setOpenAuthorSelectionDialog(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch bylines");
      setBylines([]);
      dispatch(setAnalysisError(ERRORS.GENERAL_ERROR));
    } finally {
      setLoadingBylines(false);
    }
  };

  const handleBylineSelect = (byline: Byline) => {
    setSelectedByline(byline);
    setOpenAuthorSelectionDialog(false);
    // setShowConfirmationDialog(true);
  };

  const handleSubmit = async (byline: Byline) => {
    if (loadingAnalyze.current) return;
    if (loading) return;
    if (!validateUrl(url)) {
      dispatch(setAnalysisError(ERRORS.INVALID_URL));
      return;
    }
    if (!validateSubstackUrl(url)) {
      dispatch(setAnalysisError(ERRORS.INVALID_SUBSTACK_URL));
      return;
    }
    dispatch(setAnalysisError(null));
    setLoading(true);
    loadingAnalyze.current = true;
    
    setIsOpen(false);
    setShowConfirmationDialog(false);

    try {
      handleBylineSelect(byline);
      onAnalyzing?.(true);
      dispatch(setGeneratingDescription(true));
      
      setIsOpen(false);
      await analyzePublication(url, byline);
      await onAnalyzed?.();
      dispatch(setGeneratingDescription(false));
    } catch (error: any) {
      Logger.error("Error analyzing publication:", error);
      if (error.response?.status === 404) {
        dispatch(
          setAnalysisError({
            ...ERRORS.PUBLICATION_NOT_FOUND,
            value: error.response?.data?.error,
          }),
        );
      } else {
        const errorMessage =
          error instanceof Error ? error.message : ERRORS.GENERAL_ERROR.value;
        dispatch(
          setAnalysisError({
            ...ERRORS.GENERAL_ERROR,
            value: errorMessage,
          }),
        );
      }
      onAnalyzing?.(false);
      onAnalysisFailed?.();
      dispatch(setGeneratingDescription(false));
      
      setIsOpen(true);
    } finally {
      setLoading(false);
      loadingAnalyze.current = false;
    }
  };

  const startAnalysis = () => {
    onAnalyzing?.(true);
    setShowConfirmationDialog(false);
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
          closeOnOutsideClick={false}
          className="sm:max-w-[425px]"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle aria-label="Connect your Substack">
              Connect your Substack
            </DialogTitle>
            <DialogDescription>
              Enter your Substack URL to connect your newsletter. We&apos;ll
              analyze your content and writing style.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-1">
              <Input
                id="substackUrl"
                placeholder="your-newsletter.substack.com"
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
              <p className="text-xs text-muted-foreground">
                Can also be custom domain
              </p>
            </div>

            {analysisError?.value && (
              <div className="flex flex-col items-start">
                <AnimatePresence mode="popLayout">
                  <MotionAlert
                    key={analysisError.value}
                    variant={
                      analysisError.type === "error" ? "destructive" : "warning"
                    }
                    className="flex flex-row items-center pb-1.5 pr-2"
                  >
                    {analysisError.type === "error" ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertDescription className="flex-1 leading-7">
                      {analysisError.value}
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
                              __html: analysisError.explanation,
                            }}
                          />
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </MotionAlert>
                </AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <HowToFindNewsletterUrlDialog />
                </motion.div>
              </div>
            )}
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

      {/* Final Confirmation Dialog */}
      <Dialog
        open={showConfirmationDialog}
        onOpenChange={setShowConfirmationDialog}
      >
        <DialogContent
          className="sm:max-w-[500px]"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">
              Your publication is being analyzed
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              This process will take several minutes to complete as we analyze
              your content and writing style.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
              <p className="text-sm text-primary mb-0.5">
                <span className="font-bold">What happens next:</span>
              </p>
              <p className="text-sm text-primary mb-2.5">
                Analysis may take up to 5 minutes to complete.
                <br />
                While you wait, you can:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-primary">
                <li>Go make a cup of tea or coffee (I prefer coffee)</li>
                <li>Enjoy our loading animation (You&apos;ll enjoy it)</li>
                <li>Wait for an email from us (shortly)</li>
              </ul>
            </div>

            {selectedByline && (
              <div className="text-sm text-muted-foreground">
                <p>
                  <span className="font-medium">Selected Author:</span>{" "}
                  {selectedByline.name}
                </p>
                <p>
                  {/* Publication url  */}
                  <span className="font-medium">Publication URL:</span>{" "}
                  <span>{url}</span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={startAnalysis} className="w-full sm:w-auto">
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
