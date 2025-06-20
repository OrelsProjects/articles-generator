"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { setHideFeedbackFab } from "@/lib/features/ui/uiSlice";

interface FeedbackFabProps {
  onClick: () => void;
}

export function FeedbackFab({ onClick }: FeedbackFabProps) {
  const dispatch = useAppDispatch();
  const [isHovered, setIsHovered] = useState(false);
  const [hideFab, setHideFab] = useLocalStorage("hide_feedback_fab", false);
  const { hideFeedbackFab } = useAppSelector(state => state.ui);

  useEffect(() => {
    dispatch(setHideFeedbackFab(hideFab));
  }, [hideFeedbackFab]);

  if (hideFeedbackFab) {
    return null;
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHideFab(true);
    toast.success(
      "Feedback button hidden. You can show it again in the settings.",
    );
  };

  return (
    <motion.div
      className="fixed bottom-20 md:bottom-6 right-6 z-50 "
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="relative">
        <Button
          onClick={onClick}
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-200",
            "bg-primary hover:bg-primary/90",
            "hover:scale-105 hover:shadow-xl",
          )}
        >
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">Send feedback</span>
        </Button>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute -top-2 -right-2"
            >
              <Button
                onClick={handleClose}
                size="icon"
                variant="secondary"
                className="h-6 w-6 rounded-full shadow-md"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Close feedback button</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
