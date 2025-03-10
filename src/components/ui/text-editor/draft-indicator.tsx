import type React from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export interface DraftIndicatorProps {
  saving: boolean;
  error: boolean;
  hasIdea: boolean;
  className?: string;
}

const DraftIndicator: React.FC<DraftIndicatorProps> = ({
  saving,
  error,
  hasIdea,
  className,
}) => {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!saving && !error && hasIdea) {
      setShowSaved(true);
      const timer = setTimeout(() => {
        setShowSaved(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [saving, error, hasIdea]);

  const state = useMemo(():
    | "no-idea"
    | "saving"
    | "error"
    | "saved"
    | "draft" => {
    if (!hasIdea) return "no-idea";
    if (saving) return "saving";
    if (error) return "error";
    if (showSaved) return "saved";
    return "draft";
  }, [saving, error, hasIdea, showSaved]);

  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      {state === "no-idea" ? (
        <>
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <span className="text-yellow-500">
            Generate an idea before editing
          </span>
        </>
      ) : state === "error" ? (
        <>
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-500">Not saved</span>
        </>
      ) : state === "saving" ? (
        <>
          <Loader2 className="w-4 h-4 text-foreground animate-spin" />
          <span className="text-foreground">Saving draft...</span>
        </>
      ) : state === "saved" ? (
        <>
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-500">Draft saved</span>
        </>
      ) : (
        <>
          {/* green circle */}
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-foreground">Draft</span>
        </>
      )}
    </div>
  );
};

export default DraftIndicator;
