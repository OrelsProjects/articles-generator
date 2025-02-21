import GenerateIdeasButton from "@/components/ui/generate-ideas-button";
import { AnalyzePublicationButton } from "@/components/ui/text-editor/analyze-publication-button";
import { useAppSelector } from "@/lib/hooks/redux";
import { useSettings } from "@/lib/hooks/useSettings";
import { Publication } from "@/types/publication";
import { AnimatePresence } from "framer-motion";
import { useMemo } from "react";

export default function MainActionButton() {
  const { hasPublication } = useSettings();

  return (
    <AnimatePresence>
      {!hasPublication && (
        <AnalyzePublicationButton key={"analyze-publication-button"} />
      )}
    </AnimatePresence>
  );
}
