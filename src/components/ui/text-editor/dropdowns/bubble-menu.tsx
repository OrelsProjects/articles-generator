import { FormatDropdown } from "@/components/ui/text-editor/dropdowns/format-dropdown";
import { ImprovementType } from "@/lib/prompts";
import { cn } from "@/lib/utils";
import { PlusJakartaSans } from "@/lib/utils/fonts";
import { getSelectedContentAsMarkdown } from "@/lib/utils/text-editor";
import { Editor, BubbleMenu } from "@tiptap/react";
import {
  Check,
  FileText,
  MessageSquare,
  Smile,
  Sparkles,
  ThumbsUp,
  Wand2,
  Zap,
} from "lucide-react";
import { useMemo } from "react";

const formatOptions: {
  label: string;
  icon: React.ElementType;
  divider?: boolean;
  subLabel?: string;
  type: ImprovementType;
}[] = [
  {
    type: "fact-check",
    label: "Fact-check",
    subLabel: "Check the text for accuracy",
    icon: Check,
    divider: false,
  },
  {
    type: "elaborate",
    label: "Elaborate",
    subLabel: "Make it more",
    icon: Sparkles,
    divider: false,
  },
  {
    type: "engaging",
    label: "Engaging",
    icon: MessageSquare,
    subLabel: "Make it more",
    divider: false,
  },
  {
    type: "humorous",
    label: "Humorous",
    icon: Smile,
    divider: false,
  },
  {
    type: "positive",
    label: "Positive",
    icon: ThumbsUp,
    divider: false,
  },
  {
    type: "creative",
    label: "Creative",
    icon: Wand2,
    divider: false,
  },
  {
    type: "sarcastic",
    label: "Sarcastic",
    icon: MessageSquare,
    divider: false,
  },
  {
    type: "inspirational",
    label: "Inspirational",
    icon: Zap,
    divider: false,
  },
  {
    type: "concise",
    label: "Concise",
    icon: FileText,
    divider: false,
  },
];

export type BubbleMenuProps = {
  editor?: Editor | null;
  loading: string | null;
  handleImprovement: (type: ImprovementType) => void;
  className?: string;
};

export const BubbleMenuComponent = ({
  editor,
  loading,
  handleImprovement,
}: BubbleMenuProps) => {
  if (!editor) return null;

  const error = useMemo(() => {
    if (!editor) return { text: "", disabled: false };
    const text = getSelectedContentAsMarkdown(editor);
    if (text.length > 20) {
      return {
        text: "Text is too long",
        disabled: true,
      };
    }
    return { text: "", disabled: false };
  }, [editor]);

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 10,
        followCursor: "vertical",
        delay: 0,
        sticky: true,
      }}
      className={cn(
        "flex items-center gap-1 p-1 rounded-lg border bg-background shadow-lg",
        PlusJakartaSans.className,
      )}
    >
      <FormatDropdown
        options={formatOptions}
        loading={loading}
        onSelect={handleImprovement}
        error={error}
        type="text"
      />
    </BubbleMenu>
  );
};
