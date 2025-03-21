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
  const { publications } = useAppSelector(state => state.publications);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (publications.length > 0) {
      setOpen(false);
    }
  }, [publications]);

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
