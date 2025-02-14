import { Loader2, Sparkles } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { toast } from "react-toastify";
import { selectAuth } from "@/lib/features/auth/authSlice";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useIdea } from "@/lib/hooks/useIdea";
import { cn } from "@/lib/utils";
import {
  selectPublications,
  setLoadingNewIdeas,
} from "@/lib/features/publications/publicationSlice";
import { ToastStepper } from "@/components/ui/toast-stepper";
import { Logger } from "@/logger";

// Define loading states for generating ideas
const ideaLoadingStates = [
  { text: "Analyzing publication style..." },
  { text: "Gathering inspiration from top articles..." },
  { text: "Crafting unique article ideas..." },
  { text: "Refining ideas for clarity and impact..." },
  { text: "Finalizing the best ideas..." },
];

// A loading animation for the AI "thinking" indicator.
const AILoadingAnimation = () => (
  <div className="flex items-center gap-2 px-3 py-1.5">
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
    </div>
    <span className="text-sm text-primary font-medium">AI is thinking...</span>
  </div>
);

interface GenerateIdeasButtonProps extends Partial<ButtonProps> {
  buttonContent?: React.ReactNode;
}

export default function GenerateIdeasButton({
  buttonContent,
  variant = "default",
  size = "default",
  className,
  ...props
}: GenerateIdeasButtonProps) {
  const dispatch = useAppDispatch();
  const { publications, loadingNewIdeas } = useAppSelector(selectPublications);
  const { user } = useAppSelector(selectAuth);
  const { generateIdeas } = useIdea();
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  const [topic, setTopic] = useState("");
  const [shouldSearch, setShouldSearch] = useState(false);

  const canGenerateIdeas = useMemo(() => {
    if (!user?.meta?.plan) return false;
    return user.meta.plan !== "free";
  }, [user?.meta?.plan]);

  const text = useMemo(() => {
    if (canGenerateIdeas) {
      return showLimitDialog ? "Daily limit reached" : "Generate ideas";
    }
    if (publications.length === 0) {
      return "Connect your Substack to generate ideas";
    }
    return "Upgrade to generate ideas";
  }, [canGenerateIdeas, showLimitDialog, publications.length]);

  const handleDialogSubmit = async () => {
    setShowTopicDialog(false);
    try {
      setIsGenerating(true);
      dispatch(setLoadingNewIdeas(true));
      await generateIdeas({ topic, shouldSearch });
      setTopic("");
      setShouldSearch(false);
    } catch (error: any) {
      Logger.error("Failed to generate ideas:", error);
      toast.error("Failed to generate ideas.. try again");
    } finally {
      setIsGenerating(false);
      dispatch(setLoadingNewIdeas(false));
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowTopicDialog(true)}
        variant={variant}
        size={size}
        className={className}
        disabled={!canGenerateIdeas || loadingNewIdeas}
        {...props}
      >
        <>
          {loadingNewIdeas ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles
              className={cn("mr-2 h-4 w-4", {
                hidden: !canGenerateIdeas,
              })}
            />
          )}
          {text}
        </>
      </Button>

      <ToastStepper
        loadingStates={ideaLoadingStates}
        loading={isGenerating}
        duration={10000}
        loop={false}
        position="bottom-left"
      />

      <Dialog open={showTopicDialog} onOpenChange={setShowTopicDialog}>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleDialogSubmit();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Specify a Topic</DialogTitle>
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
            {/* <div className="flex flex-col items-start gap-0.5">
              <Button
                variant={shouldSearch ? "default" : "outline"}
                onClick={() => setShouldSearch(!shouldSearch)}
                className={cn("w-fit rounded-full shadow-none", {
                  "bg-primary/20 border border-primary/40 text-primary hover:bg-primary/10":
                    shouldSearch,
                })}
              >
                <Globe className="w-4 h-4 mr-2" />
                Search
              </Button>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: shouldSearch ? 1 : 0 }}
                transition={{ duration: 0.15 }}
                className={cn("text-sm text-muted-foreground", {
                  "text-transparent select-none": !shouldSearch,
                })}
              >
                Generating ideas might take twice as long.
              </motion.p>
            </div> */}
            <DialogFooter>
              <Button type="submit" onClick={handleDialogSubmit}>
                {topic.length > 0
                  ? "Generate Ideas based on your topic"
                  : "Generate Ideas based on your publication"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>

      <AlertDialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Daily Limit Reached</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You&apos;ve reached your daily limit for generating ideas. This
                helps us maintain quality and prevent abuse of our AI system.
              </p>
              <p>
                Your limit will reset in the next 24 hours, or you can upgrade
                your plan for higher limits and additional features.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogAction onClick={() => setShowLimitDialog(false)}>
              I&apos;ll wait
            </AlertDialogAction>
            <AlertDialogAction asChild>
              <Link href="/settings/billing">Upgrade Plan</Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
