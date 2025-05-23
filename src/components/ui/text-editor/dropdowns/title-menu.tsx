import { Button } from "@/components/ui/button";
import {
  Wand2,
  Sparkles,
  FileText,
  MessageSquare,
  Feather,
} from "lucide-react";
import { FormatDropdown, FormatOption } from "./format-dropdown";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

export type TitleImprovementType =
  | "catchy"
  | "shorter"
  | "clearer"
  | "engaging"
  | "context"
  | "expand"
  | "generate";

const emptyTitleOptions: FormatOption[] = [
  {
    type: "generate",
    label: "Generate title",
    icon: Sparkles,
  },
];

const titleOptions: FormatOption[] = [
  {
    type: "better hook",
    label: "Better hook",
    icon: Feather,
  },
  {
    type: "catchy",
    label: "Make it catchier",
    icon: Sparkles,
  },
  {
    type: "clearer",
    label: "Make it clearer",
    icon: MessageSquare,
  },
];

const emptySubtitleOptions: FormatOption[] = [
  {
    type: "generate",
    label: "Generate subtitle",
    icon: Sparkles,
  },
];

const subtitleOptions: FormatOption[] = [
  {
    type: "expand",
    label: "Expand on title",
    icon: Sparkles,
  },
  {
    type: "engaging",
    label: "Make it engaging",
    icon: MessageSquare,
  },
  {
    type: "context",
    label: "Add context",
    icon: FileText,
  },
];

export type TitleMenuProps = {
  open: boolean;
  menuType: "title" | "subtitle";
  className?: string;
  value?: string;
  onImprove?: (
    menuType: "title" | "subtitle",
    improveType: TitleImprovementType,
  ) => Promise<void>;
};

export const TitleMenu = ({
  open,
  menuType,
  className = "",
  value,
  onImprove = async (menuType: string, improveType: string) => {},
}: TitleMenuProps) => {
  const [isOpen, setIsOpen] = useState(open);
  const [isHovering, setIsHovering] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const options = useMemo(() => {
    if (menuType === "title") {
      return value ? titleOptions : emptyTitleOptions;
    } else {
      return value ? subtitleOptions : emptySubtitleOptions;
    }
  }, [menuType, value]);

  // If not hovered, controlled by open prop. Otherwise, controlled by isHovering
  const updateOpen = (open: boolean) => {
    if (!isHovering) {
      setIsOpen(open);
    } else {
      setIsOpen(isHovering);
    }
  };

  useEffect(() => {
    updateOpen(open);
  }, [open, isHovering]);

  const handleImprove = async (type: TitleImprovementType) => {
    setLoading(type);
    onImprove(menuType, type)
      .catch()
      .finally(() => {
        setLoading(null);
      });
  };

  return (
    <FormatDropdown
      options={options}
      onSelect={(improvementType: string) =>
        handleImprove(improvementType as TitleImprovementType)
      }
      loading={loading}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      trigger={
        <Button variant="outline" size="icon">
          <Wand2 className="h-4 w-4" />
        </Button>
      }
      className={cn(
        "absolute -right-16",
        "transition-opacity duration-200",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        className,
      )}
      type="title-subtitle"
    />
  );
};
