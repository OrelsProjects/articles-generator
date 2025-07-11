import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { useAppSelector } from "@/lib/hooks/redux";
import { AnalyzePublicationDialog } from "./analyze-publication-dialog";

export function AnalyzePublicationButton({
  variant = "default",
  className,
  onAnalyzed,
}: {
  variant?: "default" | "ghost";
  className?: string;
  onAnalyzed?: () => void;
}) {
  const { publications } = useAppSelector(state => state.publications);
  const [analyzing, setAnalyzing] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (publications.length > 0) {
      setOpen(false);
      setShowLoader(false);
    }
  }, [publications]);

  // Handle the analyzing state change from the dialog
  const handleAnalyzing = (isAnalyzing: boolean) => {
    // Only show the loader after a short delay
    if (isAnalyzing) {
      // Show the loader once processing starts
      setShowLoader(true);
      setAnalyzing(true);
    } else {
      setShowLoader(false);
      setAnalyzing(false);
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

      <AnalyzePublicationDialog
        open={open}
        onOpenChange={setOpen}
        onAnalyzing={handleAnalyzing}
        onAnalyzed={onAnalyzed}
      />
    </div>
  );
}
