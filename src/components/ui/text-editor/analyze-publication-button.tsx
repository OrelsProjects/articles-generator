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
import { useAppSelector } from "@/lib/hooks/redux";
import { validateUrl } from "@/lib/utils/url";
import { AnimatePresence, motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Logger } from "@/logger";

const loadingStates = [
  { text: "Validating publication in our databases..." },
  { text: "Checking Substack availability..." },
  { text: "Analyzing writing style..." },
  { text: "Extracting publication topics..." },
  { text: "Generating content insights..." },
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

export function AnalyzePublicationButton() {
  const { analyzePublication } = usePublication();
  const { publications } = useAppSelector(state => state.publications);

  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);

  useEffect(() => {
    if (publications.length > 0) {
      setOpen(false);
    }
  }, [publications]);

  const handleSubmit = async () => {
    if (!validateUrl(url)) {
      setError(ERRORS.INVALID_URL);
      return;
    }
    setError(null);
    setLoading(true);
    setOpen(false);
    try {
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
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="create-publication-button">
      <Button onClick={() => setOpen(true)}>
        <Link2 className="mr-2 h-4 w-4" />
        Connect Substack
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Connect your Substack</DialogTitle>
            <DialogDescription>
              Enter your Substack URL to connect your newsletter. We&apos;ll
              analyze your content and writing style.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Input
                id="substackUrl"
                placeholder="your-blog.substack.com"
                className="col-span-4"
                value={url}
                onChange={e => setUrl(e.target.value)}
                disabled={loading}
              />
            </div>

            <AnimatePresence mode="popLayout">
              {error?.value && (
                <MotionAlert
                  key={error.value}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
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
                        >
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">{error.explanation}</p>
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
