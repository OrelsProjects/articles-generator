import { Globe, Loader2, Sparkles } from "lucide-react";
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
import { useIdea } from "@/lib/hooks/useIdea";
import { cn } from "@/lib/utils";
import {
  selectPublications,
  setLoadingNewIdeas,
} from "@/lib/features/publications/publicationSlice";
import { ToastStepper } from "@/components/ui/toast-stepper";
import { motion } from "framer-motion";
import { selectSettings } from "@/lib/features/settings/settingsSlice";
import { useSettings } from "@/lib/hooks/useSettings";
import { TooltipButton } from "@/components/ui/tooltip-button";
import {
  setShowGenerateIdeasDialog,
  setShowIdeasPanel,
} from "@/lib/features/ui/uiSlice";

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
  const { loadingNewIdeas } = useAppSelector(selectPublications);
  const { didExceedLimit, hasEnoughCredits, hasPublication } = useSettings();

  const canGenerateIdeas = hasEnoughCredits("ideaGeneration");

  const text = useMemo(() => {
    return didExceedLimit ? "Daily limit reached" : "Generate ideas";
  }, [didExceedLimit, hasPublication]);

  return (
    <Button
      onClick={() => dispatch(setShowGenerateIdeasDialog(true))}
      variant={variant}
      size={size}
      className={className}
      disabled={loadingNewIdeas || !canGenerateIdeas}
      {...props}
    >
      {loadingNewIdeas ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className={cn("mr-2 h-4 w-4")} />
      )}
      {text}
    </Button>
  );
}
