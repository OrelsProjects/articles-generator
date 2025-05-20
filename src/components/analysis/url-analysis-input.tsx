"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import axiosInstance from "@/lib/axios-instance";
import { toast } from "react-toastify";
import { validateSubstackUrl, validateUrl } from "@/lib/utils/url";
import { Byline } from "@/types/article";
import { AuthorSelectionDialog } from "@/components/onboarding/author-selection-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, AlertTriangle, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { MotionAlert } from "@/components/ui/motion-components";
import { AlertDescription } from "@/components/ui/alert";
import { useSession } from "next-auth/react";

export const ERRORS = {
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

interface UrlAnalysisInputProps {
  onBylineSelected: (byline: Byline, forceAnalyze?: boolean) => Promise<void>;
  isLoading?: boolean;
  hasData?: boolean;
  authorName?: string | null;
  authorImage?: string | null;
  isInputDisabled?: boolean;
  placeholder?: string;
  onUrlChange?: (url: string) => void;
  disabledButton?: boolean;
  buttonText?: string;
  headerClassName?: string;
  headerText?: string;
}

export default function UrlAnalysisInput({
  onBylineSelected,
  isLoading = false,
  hasData = false,
  authorName = null,
  authorImage = null,
  isInputDisabled = false,
  onUrlChange,
  placeholder = "Your Substack URL (e.g., yourname.substack.com)",
  disabledButton = false,
  buttonText = "Analyze Activity",
  headerClassName = "",
  headerText = "Substack Activity",
}: UrlAnalysisInputProps) {
  const { data: session } = useSession();
  const [substackUrl, setSubstackUrl] = useState("");
  const [loadingBylines, setLoadingBylines] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [bylines, setBylines] = useState<Byline[]>([]);
  const [openAuthorSelectionDialog, setOpenAuthorSelectionDialog] =
    useState(false);
  const [selectedByline, setSelectedByline] = useState<Byline | null>(null);

  const showHeader = useMemo(
    () => !!authorImage && !!authorName && hasData,
    [authorImage, authorName, hasData],
  );

  const isAdmin = useMemo(() => {
    // return session?.user.meta?.isAdmin;
    return false;
  }, [session]);

  const inputDisabled = useMemo(() => {
    return (
      !isAdmin &&
      (isLoading ||
        loadingBylines ||
        isInputDisabled ||
        (hasData && !!substackUrl))
    );
  }, [isLoading, loadingBylines, isInputDisabled, hasData, substackUrl]);

  const validatePublication = async (url: string) => {
    try {
      const res = await axiosInstance.get(
        `/api/user/analyze/validate?q=${url}`,
      );
      return res.data;
    } catch (error) {
      console.error("Error validating publication: " + url, error);
      return { valid: false, hasPublication: false };
    }
  };

  const getBylines = async () => {
    if (isLoading || loadingBylines) return;

    if (!validateUrl(substackUrl)) {
      setError(ERRORS.INVALID_URL);
      return;
    }

    if (!validateSubstackUrl(substackUrl)) {
      setError(ERRORS.INVALID_SUBSTACK_URL);
      return;
    }

    setError(null);
    setLoadingBylines(true);

    try {
      const { valid, validUrl } = await validatePublication(substackUrl);

      if (!valid) {
        setError(ERRORS.INVALID_SUBSTACK_URL);
        return;
      }

      if (validUrl) {
        setSubstackUrl(validUrl);
      }

      const response = await axiosInstance.post(`/api/publication/bylines`, {
        url: validUrl || substackUrl,
      });

      setBylines(response.data || []);
      setOpenAuthorSelectionDialog(true);
    } catch (error) {
      console.error("Failed to fetch bylines:", error);
      toast.error("Failed to fetch bylines");
      setBylines([]);
      setError(ERRORS.GENERAL_ERROR);
    } finally {
      setLoadingBylines(false);
    }
  };

  const handleBylineSelect = async (byline: Byline, forceAnalyze = false) => {
    setSelectedByline(byline);
    setOpenAuthorSelectionDialog(false);
    await onBylineSelected(byline, forceAnalyze);
  };

  const ActivityHeader = () => (
    <div className={`flex items-center gap-4 justify-center ${headerClassName}`}>
      <div className="h-14 w-14 rounded-full flex-shrink-0">
        <Avatar className="h-14 w-14 rounded-full">
          <AvatarImage src={authorImage || ""} alt="User" />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </div>
      <h3 className="text-xl font-medium">
        {authorName || ""}&apos;s {headerText}
      </h3>
    </div>
  );

  return (
    <>
      {showHeader && !isAdmin ? (
        <ActivityHeader />
      ) : (
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder={placeholder}
            value={substackUrl}
            onChange={e => {
              setSubstackUrl(e.target.value);
              onUrlChange?.(e.target.value);
            }}
            className="flex-1"
            disabled={inputDisabled}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (selectedByline) {
                  handleBylineSelect(selectedByline);
                } else {
                  getBylines();
                }
              }
            }}
          />

          <Button
            variant="outline"
            onClick={() => {
              if (selectedByline) {
                handleBylineSelect(selectedByline);
              } else {
                getBylines();
              }
            }}
            disabled={
              isLoading || loadingBylines || !substackUrl || disabledButton
            }
          >
            {loadingBylines
              ? "Looking up authors..."
              : isLoading
                ? "Analyzing..."
                : buttonText || "Analyze Activity"}
          </Button>
        </div>
      )}
      <AnimatePresence mode="popLayout">
        {error?.value && (
          <MotionAlert
            key={error.value}
            variant={error.type === "error" ? "destructive" : "warning"}
            className="flex flex-row items-center pb-1.5 pr-2 mt-4"
          >
            {error.type === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription className="flex-1 leading-7 ml-2">
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

      {/* Author Selection Dialog */}
      <AuthorSelectionDialog
        open={openAuthorSelectionDialog}
        onOpenChange={setOpenAuthorSelectionDialog}
        bylines={bylines}
        onSelect={handleBylineSelect}
      />
    </>
  );
}
