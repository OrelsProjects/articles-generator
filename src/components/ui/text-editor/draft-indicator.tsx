import type React from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useMemo } from "react";

export interface DraftIndicatorProps {
  saving: boolean;
  error: boolean;
  hasIdea: boolean;
}

const DraftIndicator: React.FC<DraftIndicatorProps> = ({
  saving,
  error,
  hasIdea,
}) => {
  const state = useMemo((): "no-idea" | "saving" | "error" | "saved" => {
    if (!hasIdea) return "no-idea";
    if (saving) return "saving";
    if (error) return "error";
    return "saved";
  }, [saving, error, hasIdea]);

  return (
    <div className="absolute top-4 left-8 flex items-center gap-2 text-sm text-muted-foreground">
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
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="text-blue-500">Saving draft...</span>
        </>
      ) : (
        <>
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-500">Draft saved</span>
        </>
      )}
    </div>
  );
};

export default DraftIndicator;
