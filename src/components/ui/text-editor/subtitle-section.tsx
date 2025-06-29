import React from "react";
import TextareaAutosize from "react-textarea-autosize";
import {
  TitleMenu,
  TitleImprovementType,
} from "@/components/ui/text-editor/dropdowns/title-menu";

export interface SubtitleSectionProps {
  subtitle: string;
  onSubtitleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  showSubtitleMenu: boolean;
  setShowSubtitleMenu: (open: boolean) => void;
  subtitleRef: React.Ref<HTMLTextAreaElement>;
  onImproveSubtitle: (
    menuType: "title" | "subtitle",
    improveType: TitleImprovementType,
  ) => Promise<void>;
}

const SubtitleSection: React.FC<SubtitleSectionProps> = ({
  subtitle,
  onSubtitleChange,
  showSubtitleMenu,
  setShowSubtitleMenu,
  subtitleRef,
  onImproveSubtitle,
}) => {
  return (
    <div
      className="flex items-center gap-2 relative"
      onFocus={() => setShowSubtitleMenu(true)}
      onBlur={() => setShowSubtitleMenu(false)}
    >
      <TextareaAutosize
        ref={subtitleRef}
        placeholder="Add a subtitle..."
        value={subtitle}
        maxLength={200}
        onChange={onSubtitleChange}
        className="w-full text-xl text-muted-foreground outline-none placeholder:text-muted-foreground border-none shadow-none resize-none focus-visible:ring-0 focus-visible:outline-none p-0 bg-transparent"
      />
      <TitleMenu
        open={showSubtitleMenu}
        menuType="subtitle"
        onImprove={onImproveSubtitle}
        value={subtitle}
      />
    </div>
  );
};

export default SubtitleSection;
