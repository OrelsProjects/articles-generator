"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export interface NoteEditorAdvancedSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function NoteEditorAdvancedSheet({
  open,
  onOpenChange,
}: NoteEditorAdvancedSheetProps) {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: "-100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "-100%" }}
          transition={{ duration: 0.3 }}
          className="h-60 w-full p-10 bg-card mt-72"
        />
      )}
    </AnimatePresence>
  );
}
