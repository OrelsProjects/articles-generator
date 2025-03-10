import { usePublication } from "@/lib/hooks/usePublication";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { useAppSelector } from "@/lib/hooks/redux";
import { validateUrl } from "@/lib/utils/url";
import { Logger } from "@/logger";
import { AnalyzePublicationDialog } from "./analyze-publication-dialog";

const loadingStatesConst = [
  { text: "Validating publication in our databases..." },
  { text: "Checking Substack availability..." },
  { text: "Extracting publications...", delay: 20000 },
  { text: "Analyzing writing style...", delay: 20000 },
  { text: "Generating content insights...", delay: 1000 },
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
    value: "Substack does not exist 🤔",
    type: "warn" as const,
    explanation: "Seems like the URL doesn't have a Substack. 🤔",
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

export function AnalyzePublicationButton({
  variant = "default",
  className,
}: {
  variant?: "default" | "ghost";
  className?: string;
}) {
  const { analyzePublication, validatePublication } = usePublication();
  const { publications } = useAppSelector(state => state.publications);

  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [loadingStates, setLoadingStates] = useState(loadingStatesConst);

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
      const { valid, hasPublication } = await validatePublication(url);
      if (!valid) {
        setError(ERRORS.INVALID_SUBSTACK_URL);
        setOpen(true);
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
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="create-publication-button">
      <Button
        onClick={() => setOpen(true)}
        variant={variant}
        className={className}
      >
        <Link2 className="mr-2 h-4 w-4" />
        Connect Substack
      </Button>

      <AnalyzePublicationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
