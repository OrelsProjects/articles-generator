"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IdeasPanel } from "./ideas-panel";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Publication } from "@/types/publication";
import { Idea } from "@/types/idea";
export interface IdeasSideSheetProps {
  publication: Publication | null;
  selectedIdea: Idea | null;
}

export const IdeasSideSheet = ({
  publication,
  selectedIdea,
}: IdeasSideSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!publication || !selectedIdea) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full max-w-md bg-background z-50 shadow-lg"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              onClick={() => setIsOpen(false)}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <IdeasPanel />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ x: "150%" }}
            animate={{ x: 0, transition: { delay: 0.3 } }}
            exit={{ x: "150%" }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="fixed top-1/2 right-4 -translate-y-full z-50"
          >
            <Button
              variant="default"
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
              onClick={() => setIsOpen(true)}
            >
              <Sparkles className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
