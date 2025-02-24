"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IdeasPanel } from "./ideas-panel";
import { Button } from "@/components/ui/button";
import { ArrowRight, StickyNote } from "lucide-react";
import { Publication } from "@/types/publication";
import { Idea } from "@/types/idea";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import { MotionButton } from "@/components/ui/motion-components";
import { useSelector } from "react-redux";
import { selectUi, setShowIdeasPanel } from "@/lib/features/ui/uiSlice";
import { useAppDispatch } from "@/lib/hooks/redux";
export interface IdeasSideSheetProps {
  publication: Publication | null;
  selectedIdea: Idea | null;
}

export const IdeasSideSheet = ({
  publication,
  selectedIdea,
}: IdeasSideSheetProps) => {
  const dispatch = useAppDispatch();
  const { showIdeasPanel } = useSelector(selectUi);
  const [features, setFeatures] = useLocalStorage<{ ideasPress: boolean }>(
    "features",
    {
      ideasPress: false,
    },
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!features.ideasPress) {
      setIsOpen(true);
      setFeatures({ ...features, ideasPress: true });
    }
  }, [features.ideasPress]);

  useEffect(() => {
    if (showIdeasPanel) {
      setIsOpen(true);
      dispatch(setShowIdeasPanel(false));
    }
  }, [showIdeasPanel]);

  const didPressIdeas = features.ideasPress;

  const handleOpenIdeas = (open: boolean) => {
    setFeatures({ ...features, ideasPress: true });
    setIsOpen(open);
  };

  if (!publication || !selectedIdea) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="absolute inset-0 w-screen h-screen"
              onClick={() => handleOpenIdeas(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-screen fixed top-0 right-0 h-full max-w-md bg-background z-50 shadow-lg"
            >
              <IdeasPanel onClose={() => handleOpenIdeas(false)} />
              <MotionButton
                initial={{ x: "100%" }}
                animate={{
                  x: 0,
                  transition: {
                    delay: 0.6,
                    duration: 0.2,
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  },
                }}
                exit={{ opacity: 0, transition: { delay: 0, duration: 0 } }}
                variant="ghost"
                size="icon"
                className="w-fit px-4 pl-3 absolute top-1/2 -left-10 flex justify-start bg-muted/30 rounded-l-lg rounded-r-none border border-muted-foreground/30 -z-10"
                onClick={() => handleOpenIdeas(false)}
              >
                <ArrowRight className="h-4 w-4" />
              </MotionButton>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && didPressIdeas && (
          <motion.div
            initial={{ x: "150%" }}
            animate={{ x: 0, transition: { delay: 0.3 } }}
            exit={{ x: "150%" }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="fixed top-1/2 right-4 -translate-y-full z-50"
          >
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 1.5, duration: 0.3 }}
              className="hover:!opacity-100 transition-opacity duration-200"
            >
              <Button
                variant="default"
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg"
                onClick={() => handleOpenIdeas(true)}
              >
                <StickyNote className="h-6 w-6" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
