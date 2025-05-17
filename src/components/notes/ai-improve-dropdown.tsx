import { FormatDropdown } from "@/components/ui/text-editor/dropdowns/format-dropdown";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { ImprovementType } from "@/lib/prompts";
import {
  Sparkles,
  RefreshCw,
  MessageSquare,
  Smile,
  ThumbsUp,
  Wand2,
  Zap,
  FileText,
  User,
  AudioLines,
  Anchor,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Note, NoteDraft } from "@/types/note";
import { EventTracker } from "@/eventTracker";
import { useNotes } from "@/lib/hooks/useNotes";
import { Model } from "@/lib/open-router";
import { toast } from "react-toastify";
import { FrontendModel } from "@/components/notes/ai-models-dropdown";

// Define format options for the dropdown
const formatOptions: {
  label: string;
  icon: React.ElementType;
  divider?: boolean;
  subLabel?: string;
  tooltip?: string;
  type: ImprovementType;
  newUntil?: Date;
}[] = [
  {
    type: "new-version",
    label: "New version",
    subLabel: "Same but new",
    tooltip: "Keep the same topic, but change the note",
    icon: AudioLines,
    divider: false,
  },
  {
    type: "better-hook",
    label: "Better hook",
    tooltip: "Make it more engaging",
    icon: Anchor,
    divider: false,
    newUntil: new Date("2025-06-01"),
  },
  {
    type: "fit-user-style",
    label: "Fit my style",
    subLabel: "Fill in the blanks",
    tooltip: "Make it sound like you",
    icon: User,
    divider: false,
  },
  {
    type: "elaborate",
    label: "Keep writing",
    tooltip: "Complete to a full note",
    icon: Sparkles,
    divider: false,
  },
  {
    type: "human-like",
    label: "Human-like",
    subLabel: "Make it more",
    tooltip: "Make it more human-like",
    icon: User,
    divider: false,
  },
  {
    type: "engaging",
    label: "Engaging",
    tooltip: "Make it more engaging",
    icon: MessageSquare,
    divider: false,
  },
  {
    type: "humorous",
    label: "Humorous",
    tooltip: "Make it more humorous",
    icon: Smile,
    divider: false,
  },
  {
    type: "positive",
    label: "Positive",
    tooltip: "Make it more positive",
    icon: ThumbsUp,
    divider: false,
  },
  {
    type: "creative",
    label: "Creative",
    tooltip: "Make it more creative",
    icon: Wand2,
    divider: false,
  },
  {
    type: "sarcastic",
    label: "Sarcastic",
    tooltip: "Make it more sarcastic",
    icon: MessageSquare,
    divider: false,
  },
  {
    type: "inspirational",
    label: "Inspirational",
    tooltip: "Make it more inspirational",
    icon: Zap,
    divider: false,
  },
  {
    type: "concise",
    label: "Concise",
    tooltip: "Make it more concise",
    icon: FileText,
    divider: false,
  },
];

export interface AIImproveDropdownProps {
  note: Note | NoteDraft | null;
  selectedModel: FrontendModel;
  onImprovement?: (improvedText: string) => void;
}
export default function AIImproveDropdown({
  note,
  selectedModel,
  onImprovement,
}: AIImproveDropdownProps) {
  const [loadingImprovement, setLoadingImprovement] = useState(false);
  const { improveText } = useNotes();

  const handleImproveText = async (type: ImprovementType) => {
    if (!note) return;
    if (loadingImprovement) return;
    EventTracker.track("generate_notes_sidebar_improve_text_" + type);

    let selectedText = note.body;

    setLoadingImprovement(true);
    try {
      const improvedText = await improveText(
        selectedText,
        type,
        note.id || null,
        selectedModel,
      );
      if (improvedText) {
        onImprovement?.(improvedText.text);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to improve text");
    } finally {
      setLoadingImprovement(false);
    }
  };

  const hasContent = useMemo(() => {
    return note ? note.body.length > 0 : false;
  }, [note]);

  const improveDropdownOptions = useMemo(() => {
    return formatOptions;
  }, [note]);

  return (
    <FormatDropdown
      options={improveDropdownOptions}
      loading={loadingImprovement ? "loading" : null}
      onSelect={type => {
        handleImproveText(type as ImprovementType);
      }}
      type="text"
      disabled={loadingImprovement || !hasContent}
      trigger={
        <TooltipButton
          disabled={!hasContent || loadingImprovement}
          tooltipContent="Improve selected text (1 credit)"
          variant="ghost"
          size="icon"
          className="text-muted-foreground transition-colors"
        >
          {loadingImprovement ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
        </TooltipButton>
      }
    />
  );
}
