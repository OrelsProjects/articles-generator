import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { useAppSelector } from "@/lib/hooks/redux";
import { AnalyzePublicationDialog } from "./analyze-publication-dialog";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";

const loadingStatesConst = [
  { text: "Validating publication in our databases..." },
  { text: "Checking Substack availability..." },
  { text: "Extracting publications...", delay: 7000 },
  { text: "Analyzing writing style...", delay: 7000 },
  { text: "Generating content insights...", delay: 7000 },
  { text: "Setting up your preferences..." },
  { text: "Almost done...", delay: 7000 },
  { text: "I promise, it's almost ready...", delay: 7000 },
  {
    text: "You have a humongous publication, my machines really struggle...🤖",
    delay: 7000,
  },
  {
    text: "Okay, if you're still here, I'll let you in on a secret: I've been faking it.",
    delay: 7000,
  },
  {
    text: "The statuses are not real. I just wanted to make you feel good while you wait.",
    delay: 7000,
  },
  { text: "Well, this is awkward... Hope it finishes soon...🤦", delay: 3000 },
];

export function AnalyzePublicationButton({
  variant = "default",
  className,
}: {
  variant?: "default" | "ghost";
  className?: string;
}) {
  const { publications } = useAppSelector(state => state.publications);
  const [analyzing, setAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (publications.length > 0) {
      setOpen(false);
      setIsProcessing(false);
      setShowLoader(false);
    }
  }, [publications]);
  
  // Handle the analyzing state change from the dialog
  const handleAnalyzing = (isAnalyzing: boolean) => {
    setIsProcessing(isAnalyzing);
    
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
      />

      {/* Only show the loader when showLoader is true */}
      {showLoader && (
        <MultiStepLoader
          loadingStates={loadingStatesConst}
          loading={analyzing}
          duration={7000}
          loop={false}
        />
      )}
    </div>
  );
}
