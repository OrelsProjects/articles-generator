import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NoteFeedback } from "@/types/note";
import { RefreshCw, ThumbsDown, X } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipButton } from "@/components/ui/tooltip-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define feedback options
export const FEEDBACK_OPTIONS = [
  {
    value: "It has incorrect information about me",
    label: "It has incorrect information about me",
  },
  {
    value: "The note is irrelevant or false",
    label: "The note is irrelevant or false",
  },
  { value: "The note is boring", label: "The note is boring" },
];

type DislikeFeedbackPopoverProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (feedbackText: string) => void;
  isLoading: boolean;
  feedback: NoteFeedback | null | undefined;
  disabled?: boolean;
};

export const DislikeFeedbackPopover = ({
  isOpen,
  onOpenChange,
  onSubmit,
  isLoading,
  feedback,
  disabled,
}: DislikeFeedbackPopoverProps) => {
  const [feedbackReason, setFeedbackReason] = useState("");

  const handleSubmit = () => {
    onSubmit(feedbackReason);
    setFeedbackReason("");
  };

  if (feedback === "dislike") {
    return (
      <TooltipButton
        tooltipContent="Dislike - this helps our AI understand what you don't like"
        variant="ghost"
        size="sm"
        disabled={disabled}
        className={cn("hover:text-primary", "text-primary")}
        onClick={e => {
          if (feedback === "dislike") {
            e.preventDefault();
            onOpenChange(false);
            handleSubmit();
          }
        }}
      >
        {isLoading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsDown className="h-4 w-4" />
        )}
      </TooltipButton>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <TooltipButton
          tooltipContent="Dislike - this helps our AI understand what you don't like"
          disabled={disabled}
          variant="ghost"
          size="sm"
          className={cn("hover:text-primary")}
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <ThumbsDown className="h-4 w-4" />
          )}
        </TooltipButton>
      </PopoverTrigger>
      <PopoverContent hideCloseButton className="w-80 p-4" side="top">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              What didn&apos;t you like about this note?
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Select value={feedbackReason} onValueChange={setFeedbackReason}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              {FEEDBACK_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSubmit}
              disabled={!feedbackReason}
            >
              Submit
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
