import GenerateIdeasButton from "@/components/ui/generate-ideas-button";
import { AnalyzePublicationButton } from "@/components/ui/text-editor/analyze-publication-button";
import { Publication } from "@/types/publication";
import { AnimatePresence } from "framer-motion";

export default function MainActionButton({
  publication,
}: {
  publication: Publication | null;
}) {
  return (
    <>
      <AnimatePresence>
        {/* {publication && <GenerateIdeasButton key={"generate-ideas-button"} />} */}
      </AnimatePresence>
      <AnimatePresence>
        {!publication && (
          <AnalyzePublicationButton key={"analyze-publication-button"} />
        )}
      </AnimatePresence>
    </>
  );
}
