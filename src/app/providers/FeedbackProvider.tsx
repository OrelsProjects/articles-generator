"use client";

import { useState } from "react";
import { FeedbackFab } from "@/components/ui/feedback-fab";
import { FeedbackDialog } from "@/components/ui/feedback-dialog";

export function FeedbackProvider() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <FeedbackFab onClick={() => setIsOpen(true)} />
      <FeedbackDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
} 