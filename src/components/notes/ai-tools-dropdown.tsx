"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NoteDraft } from "@/types/note";
import AIImproveDropdown from "./ai-improve-dropdown";
import { AiModelsDropdown, FrontendModel } from "./ai-models-dropdown";
import { useUi } from "@/lib/hooks/useUi";
interface AIToolsDropdownProps {
  note: NoteDraft | null;
  onImprovement: (text: string) => void;
}

export function AIToolsDropdown({ note, onImprovement }: AIToolsDropdownProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { hasAdvancedGPT } = useUi();
  const [selectedModel, setSelectedModel] = useState<FrontendModel>("auto");

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-0.5 rounded-lg">
        <AIImproveDropdown
          note={note}
          selectedModel={selectedModel}
          onImprovement={onImprovement}
        />
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "auto", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden md:hidden"
        >
          <AiModelsDropdown
            onModelChange={setSelectedModel}
            size="md"
            classNameTrigger="!text-muted-foreground"
          />
        </motion.div>
        {/* {hasAdvancedGPT && (
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden hidden md:block"
              >
                <AiModelsDropdown
                  onModelChange={setSelectedModel}
                  size="md"
                  classNameTrigger="!text-muted-foreground"
                />
              </motion.div>
            )}
          </AnimatePresence>
        )} */}
      </div>
    </div>
  );
}
