import React from "react";
import TextareaAutosize from "react-textarea-autosize";
import { TitleImprovementType, TitleMenu } from "@/components/ui/text-editor/dropdowns/title-menu";

export interface TitleSectionProps {
  title: string;
  onTitleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  showTitleMenu: boolean;
  setShowTitleMenu: (open: boolean) => void;
  titleRef: React.Ref<HTMLTextAreaElement>;
  onImproveTitle: (menuType: "title" | "subtitle", improveType: TitleImprovementType) => Promise<void>;
}

const TitleSection: React.FC<TitleSectionProps> = ({
  title,
  onTitleChange,
  showTitleMenu,
  setShowTitleMenu,
  titleRef,
  onImproveTitle,
}) => {
  return (
    <div
      className="w-full flex items-center gap-2 relative"
      onFocus={() => setShowTitleMenu(true)}
      onBlur={() => setShowTitleMenu(false)}
    >
      <TextareaAutosize
        ref={titleRef}
        placeholder="Title"
        value={title}
        onChange={onTitleChange}
        maxLength={200}
        className="w-full text-4xl font-bold outline-none placeholder:text-muted-foreground border-none shadow-none resize-none focus-visible:ring-0 focus-visible:outline-none p-0"
      />
      <TitleMenu open={showTitleMenu} menuType="title" onImprove={onImproveTitle} />
    </div>
  );
};

export default TitleSection; 