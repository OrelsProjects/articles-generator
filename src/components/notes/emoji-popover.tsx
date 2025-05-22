import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { SmilePlus } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useTheme } from "next-themes";
import { Skin } from "@emoji-mart/data";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { EventTracker } from "@/eventTracker";

interface EmojiPopoverProps {
  onEmojiSelect: (emoji: Skin) => void;
}

export default function EmojiPopover({ onEmojiSelect }: EmojiPopoverProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <TooltipButton
          tooltipContent="Add emoji"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => {
            EventTracker.track("emoji_popover_open");
          }}
        >
          <SmilePlus className="h-5 w-5 text-muted-foreground" />
        </TooltipButton>
      </PopoverTrigger>
      <PopoverContent
        hideCloseButton
        className="w-full p-0 border-none"
        side="top"
        align="start"
      >
        <Picker
          data={data}
          onEmojiSelect={onEmojiSelect}
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          previewPosition="none"
          skinTonePosition="none"
        />
      </PopoverContent>
    </Popover>
  );
}
