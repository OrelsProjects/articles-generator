import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { useAppSelector } from "@/lib/hooks/redux";
import { AnalyzePublicationDialog } from "./analyze-publication-dialog";

export function AnalyzePublicationButton({
  variant = "default",
  className,
  onAnalyzed,
  onAnalyzing,
  onAnalysisFailed,
  hide = false,
}: {
  variant?: "default" | "ghost";
  className?: string;
  onAnalyzed?: () => Promise<unknown>;
  onAnalyzing?: (analyzing: boolean) => void;
  onAnalysisFailed?: () => void;
  hide?: boolean;
}) {
  const { publications } = useAppSelector(
    state => state.publications,
  );
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

      <AnalyzePublicationDialog
        open={open}
        onOpenChange={setOpen}
        onAnalyzed={onAnalyzed}
        onAnalyzing={onAnalyzing}
        onAnalysisFailed={onAnalysisFailed}
        hide={hide}
      />
    </div>
  );
}
