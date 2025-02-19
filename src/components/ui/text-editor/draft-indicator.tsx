import { cn } from "@/lib/utils";
import React from "react";

export interface DraftIndicatorProps {
  saving: boolean;
  error: boolean;
  hasIdea: boolean;
}

const DraftIndicator: React.FC<DraftIndicatorProps> = ({ saving, error, hasIdea }) => {
  return (
    <div className="absolute top-4 left-8 flex items-center gap-2 text-sm text-muted-foreground">
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          saving ? "border border-green-500" : "bg-green-500",
          error ? "border border-red-500 bg-red-500" : "",
          !hasIdea ? "border border-yellow-500 bg-yellow-500" : ""
        )}
      />
      {!hasIdea ? (
        <span className="text-muted-foreground/80">
          Generate an idea before editing
        </span>
      ) : (
        !error && <span>{saving ? "Draft saving..." : "Draft"}</span>
      )}
      {error && <span>Not saved</span>}
    </div>
  );
};

export default DraftIndicator; 