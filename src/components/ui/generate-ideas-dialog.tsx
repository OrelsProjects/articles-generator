import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { setLoadingNewIdeas } from "@/lib/features/publications/publicationSlice";
import { selectSettings } from "@/lib/features/settings/settingsSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { useIdea } from "@/lib/hooks/useIdea";
import { useSettings } from "@/lib/hooks/useSettings";
import { useMemo, useState } from "react";
import {
  selectUi,
  setShowGenerateIdeasDialog,
  setShowIdeasPanel,
} from "@/lib/features/ui/uiSlice";
import { toast } from "react-toastify";

export default function GenerateIdeasDialog() {
  const dispatch = useAppDispatch();
  const { showGenerateIdeasDialog } = useAppSelector(selectUi);
  const { hasEnoughCredits } = useSettings();
  const { generateIdeas } = useIdea();
  const [topic, setTopic] = useState("");
  const [shouldSearch, setShouldSearch] = useState(false);

  const handleDialogSubmit = async () => {
    dispatch(setShowGenerateIdeasDialog(false));
    try {
      dispatch(setLoadingNewIdeas(true));
      await generateIdeas({ topic, shouldSearch });
      dispatch(setShowIdeasPanel(true));
      setTopic("");
      setShouldSearch(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to generate ideas.. try again",
      );
    } finally {
      dispatch(setLoadingNewIdeas(false));
    }
  };

  const didExceedLimit = !hasEnoughCredits("ideaGeneration");

  return (
    <Dialog
      open={showGenerateIdeasDialog}
      onOpenChange={() => dispatch(setShowGenerateIdeasDialog(false))}
    >
      <form
        onSubmit={e => {
          e.preventDefault();
          handleDialogSubmit();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle aria-label="Specify a topic">
              Specify a topic
            </DialogTitle>
          </DialogHeader>
          <Input
            type="text"
            placeholder="Enter a specific topic (optional)"
            value={topic}
            maxLength={200}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleDialogSubmit();
              }
            }}
          />

          <div className="flex flex-col items-start gap-0.5">
            <TooltipButton
              tooltipContent={"Search for ideas based on your topic"}
              variant={shouldSearch ? "default" : "outline"}
              onClick={() => {
                setShouldSearch(!shouldSearch);
              }}
              className={cn("w-fit rounded-full shadow-none", {
                "bg-primary/20 border border-primary/40 text-primary hover:bg-primary/10":
                  shouldSearch,
              })}
            >
              <Globe className="w-4 h-4 mr-2" />
              Smart Search
            </TooltipButton>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: shouldSearch ? 1 : 0 }}
              transition={{ duration: 0.15 }}
              className={cn("text-sm text-muted-foreground", {
                "text-transparent select-none hidden": !shouldSearch,
              })}
            >
              Generating ideas might take twice as long.
            </motion.p>
          </div>
          <DialogFooter className="w-fit ml-auto flex !flex-col items-end gap-0.5">
            <Button type="submit" onClick={handleDialogSubmit}>
              {didExceedLimit ? (
                <p>Upgrade to generate ideas</p>
              ) : topic.length > 0 ? (
                "Generate Ideas based on your topic"
              ) : (
                "Generate Ideas based on your publication"
              )}
            </Button>
            <p
              className={cn("text-sm text-muted-foreground", {
                "text-red-400": didExceedLimit,
              })}
            >
              (3 credits)
            </p>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
